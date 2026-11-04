import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

const schema = z.object({
  days: z.number().int().positive().max(365),
  reason: z.string().min(1).max(300),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'grant_pro', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const { days, reason } = schema.parse(body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);

      const now = new Date();
      const currentPro = target.proUntil && target.proUntil > now ? target.proUntil : now;
      const newPro = new Date(currentPro.getTime() + days * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { proUntil: newPro } });
        await tx.subscription.create({
          data: {
            userId: id,
            source: 'ADMIN_GIFT',
            startsAt: now,
            endsAt: newPro,
          },
        });
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_pro_granted',
        meta: { days, reason, newProUntil: newPro.toISOString() },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, proUntil: newPro });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

