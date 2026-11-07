import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await requireAdmin(req, 'manage_subscriptions', async () => {
      const { id } = await params;
      const sub = await prisma.subscription.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, phone: true, name: true, businessName: true, email: true, proUntil: true } },
          invoice: true,
        },
      });
      if (!sub) return jsonError('NOT_FOUND', 'Abonnement introuvable', 404);
      return jsonOk({ subscription: sub });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  action: z.enum(['extend', 'cancel']),
  days: z.number().int().positive().max(365).optional(),
  reason: z.string().min(1).max(300),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await requireAdmin(req, 'extend_subscription', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const data = patchSchema.parse(await req2.json());

      const sub = await prisma.subscription.findUnique({ where: { id }, include: { user: true } });
      if (!sub) return jsonError('NOT_FOUND', 'Abonnement introuvable', 404);

      if (data.action === 'extend') {
        if (!data.days) return jsonError('VALIDATION_ERROR', 'days requis pour extend', 422);
        const now = new Date();
        const currentPro = sub.user.proUntil && sub.user.proUntil > now ? sub.user.proUntil : now;
        const newPro = new Date(currentPro.getTime() + data.days * 86_400_000);

        await prisma.$transaction(async (tx) => {
          await tx.user.update({ where: { id: sub.userId }, data: { proUntil: newPro } });
          await tx.subscription.update({ where: { id }, data: { endsAt: newPro } });
        });

        await writeAudit({
          actorId: admin.id,
          targetId: sub.userId,
          action: 'admin_subscription_extended',
          meta: { subscriptionId: id, days: data.days, reason: data.reason, newProUntil: newPro.toISOString() },
          ip,
          userAgent,
        });

        return jsonOk({ ok: true, proUntil: newPro });
      }

      // Cancel
      const cancelDate = new Date();
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: sub.userId }, data: { proUntil: cancelDate } });
        await tx.subscription.update({ where: { id }, data: { endsAt: cancelDate } });
      });

      await writeAudit({
        actorId: admin.id,
        targetId: sub.userId,
        action: 'admin_subscription_cancelled',
        meta: { subscriptionId: id, reason: data.reason },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, cancelled: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

