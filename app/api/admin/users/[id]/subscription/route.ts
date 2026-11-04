import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

const schema = z.object({
  proUntil: z.string().datetime(),
  reason: z.string().min(1).max(300),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'modify_subscription', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const { proUntil, reason } = schema.parse(body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);

      const newPro = new Date(proUntil);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { proUntil: newPro } });
        await tx.subscription.create({
          data: {
            userId: id,
            source: 'ADMIN_GIFT',
            startsAt: new Date(),
            endsAt: newPro,
          },
        });
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_subscription_modified',
        meta: { reason, proUntil: newPro.toISOString() },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, proUntil: newPro });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

