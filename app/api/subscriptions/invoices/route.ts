import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const invoices = await prisma.subscriptionInvoice.findMany({
        where: { userId: user.id },
        orderBy: { paidAt: 'desc' },
        select: {
          id: true,
          number: true,
          amountXaf: true,
          totalXaf: true,
          paidAt: true,
          periodStart: true,
          periodEnd: true,
          pdfPath: true,
          locale: true,
        },
      });
      return jsonOk({ invoices });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

