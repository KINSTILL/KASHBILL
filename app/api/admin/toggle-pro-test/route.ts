import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, ip, userAgent }) => {
      if (user.role !== 'ADMIN') {
        return jsonError('FORBIDDEN', 'Réservé aux administrateurs', 403);
      }

      const now = new Date();
      const isCurrentlyPro = user.proUntil ? new Date(user.proUntil) > now : false;
      const newProUntil = isCurrentlyPro
        ? null
        : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 an de test Pro

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { proUntil: newProUntil },
        });

        if (newProUntil) {
          await tx.subscription.create({
            data: {
              userId: user.id,
              source: 'ADMIN_GIFT',
              startsAt: now,
              endsAt: newProUntil,
            },
          });
        }
      });

      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'admin_toggle_pro_test',
        meta: { isPro: !isCurrentlyPro, proUntil: newProUntil ? newProUntil.toISOString() : null },
        ip,
        userAgent,
      });

      return jsonOk({
        ok: true,
        isPro: !isCurrentlyPro,
        proUntil: newProUntil,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
