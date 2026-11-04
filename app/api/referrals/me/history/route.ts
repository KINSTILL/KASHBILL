import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const referrals = await prisma.referral.findMany({
        where: { parrainId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          status: true,
          createdAt: true,
          triggeredAt: true,
          parrainRewardedAt: true,
          filleul: { select: { name: true, phone: true } },
        },
      });
      return jsonOk({ referrals });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

