import type { NextRequest } from 'next/server';
import type { Prisma, SubSource } from '@prisma/client';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_subscriptions', async (req2) => {
      const url = new URL(req2.url);
      const q = url.searchParams.get('q')?.trim() ?? '';
      const source = url.searchParams.get('source');
      const status = url.searchParams.get('status'); // active | expired
      const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
      const pageSize = 50;
      const now = new Date();

      const where: Prisma.SubscriptionWhereInput = {};
      if (q) {
        where.user = { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: 'insensitive' } }] };
      }
      if (source) where.source = source as SubSource;
      if (status === 'active') where.endsAt = { gt: now };
      if (status === 'expired') where.endsAt = { lte: now };

      const [items, total] = await Promise.all([
        prisma.subscription.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: { select: { id: true, phone: true, name: true, businessName: true, email: true } },
            invoice: { select: { id: true, number: true, pdfPath: true, sentByEmailAt: true } },
          },
        }),
        prisma.subscription.count({ where }),
      ]);

      return jsonOk({ items, total, page, pageSize });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

