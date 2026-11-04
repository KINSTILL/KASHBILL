import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';
import { env } from '@/lib/env';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const [total, activated] = await Promise.all([
        prisma.referral.count({ where: { parrainId: user.id } }),
        prisma.referral.count({ where: { parrainId: user.id, status: 'REWARDED' } }),
      ]);

      const userDb = await prisma.user.findUnique({
        where: { id: user.id },
        select: { referralCode: true, pendingProDays: true },
      });

      const referralCode = userDb?.referralCode ?? user.referralCode;

      return jsonOk({
        referralCode,
        referralLink: `${env.APP_URL}/fr/register?ref=${referralCode}`,
        stats: { total, activated, proDaysEarned: activated * 7 },
        pendingProDays: userDb?.pendingProDays ?? user.pendingProDays,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

