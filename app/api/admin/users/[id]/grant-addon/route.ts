import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

const schema = z.object({
  type: z.enum(['EXTRA_DEVICE', 'WHITE_LABEL', 'CUSTOM_WHATSAPP']),
  days: z.number().int().positive().max(365),
  reason: z.string().min(1).max(300),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'grant_addon', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const { type, days, reason } = schema.parse(body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);

      const now = new Date();
      // Si un add-on de même type existe et est actif, on prolonge sa date de fin
      const existing = await prisma.userAddOn.findFirst({
        where: { userId: id, type, endsAt: { gt: now } },
        orderBy: { endsAt: 'desc' },
      });

      const baseDate = existing?.endsAt && existing.endsAt > now ? existing.endsAt : now;
      const newEndsAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

      const created = await prisma.$transaction(async (tx) => {
        const sub = await tx.subscription.create({
          data: {
            userId: id,
            source: 'ADMIN_GIFT',
            addOnType: type,
            startsAt: now,
            endsAt: newEndsAt,
          },
        });

        return tx.userAddOn.create({
          data: {
            userId: id,
            type,
            amountXaf: 0,
            subscriptionId: sub.id,
            startsAt: now,
            endsAt: newEndsAt,
          },
        });
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_addon_granted',
        meta: { type, days, reason, endsAt: newEndsAt.toISOString() },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, addOn: created });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
