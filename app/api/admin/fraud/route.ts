import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';
import type { FraudStatus, FraudSeverity } from '@prisma/client';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_fraud_queue', async (req2) => {
      const url = new URL(req2.url);
      const status = url.searchParams.get('status') ?? 'PENDING';
      const severity = url.searchParams.get('severity');
      const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
      const pageSize = 30;

      const where = {
        status: status as FraudStatus,
        ...(severity ? { severity: severity as FraudSeverity } : {}),
      };

      const [flags, total] = await Promise.all([
        prisma.fraudFlag.findMany({
          where,
          orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            user: { select: { id: true, phone: true, name: true, businessName: true } },
            document: { select: { id: true, number: true, type: true } },
          },
        }),
        prisma.fraudFlag.count({ where }),
      ]);

      return jsonOk({ flags, total, page, pageSize });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

