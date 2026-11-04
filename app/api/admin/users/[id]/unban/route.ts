import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'unban_user', async (_req, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);

      await prisma.user.update({
        where: { id },
        data: { bannedAt: null, bannedById: null, banReason: null },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_user_unbanned',
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

