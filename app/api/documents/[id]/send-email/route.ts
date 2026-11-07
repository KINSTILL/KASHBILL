import type { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { getResendClient, EMAIL_FROM } from '@/lib/email/client';
import { buildDocumentEmail } from '@/lib/email/templates/document-email';
import { env } from '@/lib/env';
import { rateLimit } from '@/lib/rate-limit';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatXaf } from '@/lib/pdf/shared/format';

const schema = z.object({
  to: z.string().email(),
  customMessage: z.string().max(1000).optional().nullable(),
  locale: z.enum(['fr', 'en']).default('fr'),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      const { checkEmailQuota } = await import('@/lib/quota/check');
      const quota = await checkEmailQuota(user);
      if (quota.reached) {
        return jsonError(
          'PLAN_LIMIT_REACHED',
          `Limite gratuite atteinte (${quota.limit} email/mois). Passez Pro pour un envoi illimité.`,
          403,
          { used: quota.used, limit: quota.limit }
        );
      }

      const rl = rateLimit(`email:${user.id}`, 10, 60 * 60 * 1000);
      if (!rl.allowed) {
        return jsonError('RATE_LIMITED', "Trop d'envois, réessayez plus tard.", 429);
      }

      const { id } = await params;
      const data = schema.parse(await req2.json());

      const doc = await prisma.document.findFirst({
        where: { id, userId: user.id },
        include: { client: true, verification: true },
      });
      if (!doc) return jsonError('NOT_FOUND', 'Document introuvable', 404);
      if (!doc.pdfPath) return jsonError('INTERNAL', 'PDF non disponible.', 500);

      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await readFile(path.join(process.cwd(), doc.pdfPath));
      } catch {
        return jsonError('INTERNAL', 'PDF introuvable. Régénérez le document.', 500);
      }

      const config = DOC_TYPE_CONFIG[doc.type];
      const payload = doc.payload as { total?: number };

      const template = buildDocumentEmail({
        locale: data.locale,
        senderName: user.businessName ?? user.legalName ?? user.name ?? env.APP_NAME,
        docType: data.locale === 'fr' ? config.label : config.labelEn,
        docNumber: doc.number,
        clientName: doc.client?.name ?? (data.locale === 'fr' ? 'cher client' : 'dear customer'),
        totalFormatted: formatXaf(payload.total ?? 0),
        customMessage: data.customMessage ?? null,
        verificationUrl: doc.verification?.publicToken
          ? `${env.APP_URL}/verify/${doc.verification.publicToken}`
          : null,
      });

      const sendResult = await getResendClient().emails.send({
        from: EMAIL_FROM,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments: [{ filename: `${doc.number}.pdf`, content: pdfBuffer }],
      });

      if (sendResult.error) {
        await writeAudit({
          actorId: user.id,
          targetId: doc.id,
          action: 'document_email_failed',
          meta: { to: data.to, error: sendResult.error.message },
          ip,
          userAgent,
        });
        return jsonError('INTERNAL', "Erreur lors de l'envoi.", 500);
      }

      await prisma.document.update({
        where: { id: doc.id },
        data: { sentViaEmailAt: new Date() },
      });

      await writeAudit({
        actorId: user.id,
        targetId: doc.id,
        action: 'document_email_sent',
        meta: { to: data.to, locale: data.locale },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, emailId: sendResult.data?.id ?? null });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
