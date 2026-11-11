import type { NextRequest } from 'next/server';
import { createHmac } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { encryptBuffer } from '@/lib/uploads/crypto';

const bodySchema = z.object({
  pdfBase64: z.string().min(10),
});

const SHARED_PDF_DIR = path.join(
  process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads'),
  'shared-pdfs'
);

// Non exporté : Next.js refuse les exports autres que GET/POST/... dans un fichier de route.
function signDocumentShareToken(documentId: string): string {
  return createHmac('sha256', env.JWT_SECRET)
    .update(`share-pdf:${documentId}`)
    .digest('hex')
    .slice(0, 32);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, deviceId, ip, userAgent }) => {
      const { id } = await context.params;
      const doc = await prisma.document.findFirst({
        where: { id, userId: user.id },
        select: { id: true, number: true, sentViaWhatsAppAt: true },
      });

      if (!doc) {
        return jsonError('NOT_FOUND', 'Document introuvable', 404);
      }

      const { checkWhatsAppQuota } = await import('@/lib/quota/check');
      const quota = await checkWhatsAppQuota(user);
      if (quota.reached) {
        return jsonError(
          'PLAN_LIMIT_REACHED',
          `Limite gratuite atteinte (${quota.limit} envois WhatsApp/mois). Passez Pro pour un envoi illimité.`,
          403,
          { used: quota.used, limit: quota.limit }
        );
      }

      const parsed = bodySchema.parse(await req2.json());
      const cleanBase64 = parsed.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const pdfBuffer = Buffer.from(cleanBase64, 'base64');

      await mkdir(SHARED_PDF_DIR, { recursive: true });
      const encrypted = encryptBuffer(pdfBuffer);
      const filePath = path.join(SHARED_PDF_DIR, `${doc.id}.pdf.enc`);
      await writeFile(filePath, encrypted);

      if (!doc.sentViaWhatsAppAt) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { sentViaWhatsAppAt: new Date() },
        });
      }

      try {
        const { tryActivateReferral } = await import('@/lib/referral/activate');
        await tryActivateReferral(user.id, ip, deviceId);
      } catch {}

      await writeAudit({
        actorId: user.id,
        targetId: doc.id,
        action: 'document_sent_whatsapp',
        meta: { mode: 'DIRECT_DOWNLOAD_LINK' },
        ip,
        userAgent,
      });

      const token = signDocumentShareToken(doc.id);
      const origin = req2.nextUrl.origin || env.APP_URL.replace(/\/+$/, '');
      const downloadUrl = `${origin}/api/public/documents/${doc.id}/pdf?t=${token}`;

      return jsonOk({ downloadUrl });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
