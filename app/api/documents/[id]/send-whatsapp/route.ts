import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

const bodySchema = z.object({
  phone: z.string().min(1),
  message: z.string().max(2000).optional().default(''),
  pdfBase64: z.string().min(10),
  filename: z.string().min(1).max(120),
});

function normalizeWhatsAppNumber(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    return trimmed.replace(/^\+|^00/, '').replace(/\D/g, '');
  }
  const digits = trimmed.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return digits.startsWith('237') || digits.length > 9 ? digits : `237${digits}`;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const { id } = await context.params;
      const doc = await prisma.document.findFirst({
        where: { id, userId: user.id },
        select: { id: true, number: true },
      });

      if (!doc) {
        return jsonError('NOT_FOUND', 'Document introuvable', 404);
      }

      const evolutionUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, '');
      const evolutionKey = process.env.EVOLUTION_API_KEY?.trim();
      const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME?.trim();

      if (!evolutionUrl || !evolutionKey || !evolutionInstance) {
        return jsonOk({ sentDirect: false, reason: 'NOT_CONFIGURED' });
      }

      const parsed = bodySchema.parse(await req2.json());
      const number = normalizeWhatsAppNumber(parsed.phone);
      if (!number) {
        return jsonError('VALIDATION_ERROR', 'Numéro WhatsApp invalide', 400);
      }

      const cleanBase64 = parsed.pdfBase64.replace(/^data:application\/pdf;base64,/, '');

      const evoRes = await fetch(
        `${evolutionUrl}/message/sendMedia/${encodeURIComponent(evolutionInstance)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: evolutionKey,
          },
          body: JSON.stringify({
            number,
            mediatype: 'document',
            mimetype: 'application/pdf',
            caption: parsed.message || '',
            media: cleanBase64,
            fileName: parsed.filename.endsWith('.pdf')
              ? parsed.filename
              : `${parsed.filename}.pdf`,
          }),
        }
      );

      if (!evoRes.ok) {
        return jsonOk({ sentDirect: false, reason: 'GATEWAY_ERROR' });
      }

      await prisma.document.update({
        where: { id: doc.id },
        data: { sentViaWhatsAppAt: new Date() },
      });

      return jsonOk({ sentDirect: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
