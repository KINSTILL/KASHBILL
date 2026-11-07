import type { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_invoices', async (req2) => {
      const url = new URL(req2.url);
      const q = url.searchParams.get('q')?.trim() ?? '';
      const emailStatus = url.searchParams.get('email'); // sent | not-sent
      const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
      const pageSize = 50;

      const where: Prisma.SubscriptionInvoiceWhereInput = {};
      if (q) where.number = { contains: q, mode: 'insensitive' };
      if (emailStatus === 'sent') where.sentByEmailAt = { not: null };
      if (emailStatus === 'not-sent') where.sentByEmailAt = null;

      const [items, total] = await Promise.all([
        prisma.subscriptionInvoice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: { select: { id: true, phone: true, name: true, email: true } },
            subscription: { select: { id: true, source: true } },
          },
        }),
        prisma.subscriptionInvoice.count({ where }),
      ]);

      return jsonOk({ items, total, page, pageSize });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

