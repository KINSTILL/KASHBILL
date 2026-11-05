import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_audit', async (req2) => {
      const url = new URL(req2.url);
      const action = url.searchParams.get('action');
      const targetId = url.searchParams.get('targetId');
      const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
      const pageSize = 50;

      const where = {
        ...(action ? { action } : {}),
        ...(targetId ? { targetId } : {}),
      };

      const [rows, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.auditLog.count({ where }),
      ]);

      // Pas de clé étrangère : on résout les comptes encore existants à la main.
      const ids = Array.from(
        new Set(
          rows.flatMap((r) => [r.userId, r.actorId]).filter((id): id is string => !!id)
        )
      );
      const users = ids.length
        ? await prisma.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, phone: true, name: true, role: true },
          })
        : [];
      const byId = new Map(users.map((u) => [u.id, u]));

      const logs = rows.map((r) => {
        const u = r.userId ? byId.get(r.userId) : undefined;
        const a = r.actorId ? byId.get(r.actorId) : undefined;
        return {
          ...r,
          user: u ? { phone: u.phone, name: u.name } : null,
          actor: a ? { phone: a.phone, name: a.name, role: a.role } : null,
        };
      });

      return jsonOk({ logs, total, page, pageSize });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
