import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';
import { getCached, setCached } from '@/lib/admin/stats-cache';

/**
 * Chiffre d'affaires réel : seules les subscriptions Notch Pay dont le paiement
 * a été confirmé par le webhook (audit `payment_completed`) sont comptées.
 * Les tentatives initialisées puis abandonnées ou échouées sont exclues.
 */
async function confirmedNotchPayRevenue(): Promise<{ _sum: { amountXaf: number | null } }> {
  const completed = await prisma.auditLog.findMany({
    where: { action: 'payment_completed' },
    select: { meta: true },
  });
  const refs = completed
    .map((l) => (l.meta as { providerRef?: unknown } | null)?.providerRef)
    .filter((r): r is string => typeof r === 'string' && r.length > 0);
  if (refs.length === 0) return { _sum: { amountXaf: 0 } };

  const agg = await prisma.subscription.aggregate({
    _sum: { amountXaf: true },
    where: { source: 'NOTCH_PAY', providerRef: { in: refs } },
  });
  return { _sum: { amountXaf: agg._sum.amountXaf ?? 0 } };
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_stats', async () => {
      const cached = getCached<unknown>();
      if (cached) return jsonOk(cached);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Nettoyage préventif des abonnements fantômes (TRIAL et checkouts abandonnés)
      await prisma.$executeRawUnsafe(`
        DELETE FROM "Subscription"
        WHERE "source" = 'TRIAL'
           OR ("source" = 'NOTCH_PAY' AND "startsAt" = "endsAt" AND NOT EXISTS (
             SELECT 1 FROM "SubscriptionInvoice" WHERE "SubscriptionInvoice"."subscriptionId" = "Subscription"."id"
           ));
      `).catch(() => {});

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
        confirmedNotchPayRevenue(),
        prisma.subscription.count({
          where: {
            endsAt: { gt: now },
            addOnType: null,
            source: { in: ['NOTCH_PAY', 'ADMIN_GIFT'] },
            OR: [
              { source: 'ADMIN_GIFT' },
              { source: 'NOTCH_PAY', invoice: { isNot: null } },
            ],
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

