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

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: { select: { phone: true, name: true } },
            actor: { select: { phone: true, name: true, role: true } },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return jsonOk({ logs, total, page, pageSize });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

