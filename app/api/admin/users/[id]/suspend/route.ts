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
    return await requireAdmin(req, 'suspend_user', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const { days, reason } = schema.parse(body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);

      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id },
        data: { suspendedUntil: until, suspendReason: reason },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_user_suspended',
        meta: { days, reason, until: until.toISOString() },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, suspendedUntil: until });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

