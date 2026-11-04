import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_users', async (req2) => {
      const url = new URL(req2.url);
      const search = url.searchParams.get('q')?.trim() ?? '';
      const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
      const pageSize = 30;

      const where = search
        ? {
            OR: [
              { phone: { contains: search } },
              { name: { contains: search, mode: 'insensitive' as const } },
              { businessName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            phone: true,
            name: true,
            businessName: true,
            city: true,
            role: true,
            proUntil: true,
            bannedAt: true,
            suspendedUntil: true,
            flaggedForReview: true,
            country: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return jsonOk({ users, total, page, pageSize });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

