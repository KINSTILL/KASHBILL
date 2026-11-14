import type { NextRequest } from 'next/server';
import type { Prisma, SubSource } from '@prisma/client';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_subscriptions', async (req2) => {
      // Nettoyage préventif des faux abonnements (TRIAL et checkouts abandonnés)
      await prisma.$executeRawUnsafe(`
        DELETE FROM "Subscription"
        WHERE "source" = 'TRIAL'
           OR ("source" = 'NOTCH_PAY' AND "startsAt" = "endsAt" AND NOT EXISTS (
             SELECT 1 FROM "SubscriptionInvoice" WHERE "SubscriptionInvoice"."subscriptionId" = "Subscription"."id"
           ));
      `).catch(() => {});

      const url = new URL(req2.url);
      const q = url.searchParams.get('q')?.trim() ?? '';
      const source = url.searchParams.get('source');
      const status = url.searchParams.get('status'); // active | expired
      const includeAddons = url.searchParams.get('includeAddons') === 'true';
      const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
      const pageSize = 50;
      const now = new Date();

      const where: Prisma.SubscriptionWhereInput = {
        // Uniquement les vrais abonnements (payants ou offerts par admin), hors TRIAL
        source: { in: ['NOTCH_PAY', 'ADMIN_GIFT'] },
        OR: [
          { source: 'ADMIN_GIFT' },
          { source: 'NOTCH_PAY', invoice: { isNot: null } },
        ],
      };

      if (!includeAddons) {
        where.addOnType = null;
      }

      if (q) {
        where.user = { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: 'insensitive' } }] };
      }
      if (source && source !== 'TRIAL') {
        where.source = source as SubSource;
      }
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

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_subscriptions', async (_req, { user: admin, ip, userAgent }) => {
      const deletedCount = await prisma.$executeRawUnsafe(`
        DELETE FROM "Subscription"
        WHERE "source" = 'TRIAL'
           OR ("source" = 'NOTCH_PAY' AND "startsAt" = "endsAt" AND NOT EXISTS (
             SELECT 1 FROM "SubscriptionInvoice" WHERE "SubscriptionInvoice"."subscriptionId" = "Subscription"."id"
           ));
      `);

      await writeAudit({
        actorId: admin.id,
        targetId: admin.id,
        action: 'admin_subscriptions_purged',
        meta: { deletedCount },
        ip,
        userAgent,
      });

      return jsonOk({ purged: deletedCount });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

