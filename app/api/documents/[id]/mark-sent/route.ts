import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, deviceId, ip, userAgent }) => {
      const { id } = await params;
      const doc = await prisma.document.findFirst({ where: { id, userId: user.id } });
      if (!doc) return jsonError('NOT_FOUND', 'Document introuvable', 404);

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

      if (doc.sentViaWhatsAppAt) {
        return jsonOk({ ok: true, alreadyMarked: true });
      }

      await prisma.document.update({
        where: { id },
        data: { sentViaWhatsAppAt: new Date() },
      });

      // Hook parrainage : appelé à l'étape 8
      try {
        const { tryActivateReferral } = await import('@/lib/referral/activate');
        await tryActivateReferral(user.id, ip, deviceId);
      } catch {}

      await writeAudit({
        actorId: user.id,
        targetId: id,
        action: 'document_sent_whatsapp',
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, alreadyMarked: false });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

