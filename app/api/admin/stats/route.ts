import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';
import { getCached, setCached } from '@/lib/admin/stats-cache';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_stats', async () => {
      const cached = getCached<unknown>();
      if (cached) return jsonOk(cached);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        bannedUsers,
        suspendedUsers,
        newToday,
        newThisWeek,
        totalDocs,
        docsToday,
        docsThisWeek,
        flaggedDocs,
        revenueAgg,
        activeSubs,
        totalReferrals,
        activatedReferrals,
        pendingFlags,
        confirmedFlags,
        blacklistEntries,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { bannedAt: null, suspendedUntil: { lt: now } } }),
        prisma.user.count({ where: { bannedAt: { not: null } } }),
        prisma.user.count({ where: { suspendedUntil: { gt: now } } }),
        prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.document.count(),
        prisma.document.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.document.count({ where: { createdAt: { gte: weekStart } } }),
        prisma.document.count({ where: { watermarked: false, createdAt: { gte: weekStart } } }),
        prisma.subscription.aggregate({ _sum: { amountXaf: true }, where: { source: 'NOTCH_PAY' } }),
        prisma.subscription.count({
          where: {
            endsAt: { gt: now },
            source: { in: ['NOTCH_PAY', 'REFERRAL', 'TRIAL', 'ADMIN_GIFT'] },
          },
        }),
        prisma.referral.count(),
        prisma.referral.count({ where: { status: 'REWARDED' } }),
        prisma.fraudFlag.count({ where: { status: 'PENDING' } }),
        prisma.fraudFlag.count({ where: { status: 'CONFIRMED' } }),
        prisma.blacklistEntry.count(),
      ]);

      const stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          banned: bannedUsers,
          suspended: suspendedUsers,
          newToday,
          newThisWeek,
        },
        documents: {
          total: totalDocs,
          today: docsToday,
          thisWeek: docsThisWeek,
          flagged: flaggedDocs,
        },
        revenue: {
          totalFcfa: revenueAgg._sum.amountXaf ?? 0,
          activeSubscriptions: activeSubs,
        },
        referrals: {
          total: totalReferrals,
          activated: activatedReferrals,
        },
        fraud: {
          pendingFlags,
          confirmed: confirmedFlags,
          blacklistEntries,
        },
      };

      setCached(stats, 60_000);
      return jsonOk(stats);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

