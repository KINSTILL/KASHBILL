import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'revoke_support', async (_req, { user: admin, ip, userAgent }) => {
      const { id } = await params;

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);
      if (target.role !== 'SUPPORT') return jsonError('FORBIDDEN', "Cet utilisateur n'est pas SUPPORT", 403);

      await prisma.user.update({ where: { id }, data: { role: 'USER' } });
      await prisma.device.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_support_revoked',
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

