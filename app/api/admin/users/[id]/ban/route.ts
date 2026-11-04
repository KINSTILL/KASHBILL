import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

const schema = z.object({ reason: z.string().min(1).max(300) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'ban_user', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      if (id === admin.id) return jsonError('FORBIDDEN', 'Vous ne pouvez pas vous bannir vous-même', 403);

      const body = await req2.json();
      const { reason } = schema.parse(body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);
      if (target.role === 'ADMIN') return jsonError('FORBIDDEN', 'Impossible de bannir un ADMIN', 403);

      await prisma.user.update({
        where: { id },
        data: { bannedAt: new Date(), bannedById: admin.id, banReason: reason },
      });

      // Révoquer tous les devices
      await prisma.device.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_user_banned',
        meta: { reason },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

