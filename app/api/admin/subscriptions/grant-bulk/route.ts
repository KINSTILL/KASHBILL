import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { generateSubscriptionInvoice } from '@/lib/subscriptions/generate-invoice';

const schema = z.object({
  phones: z.array(z.string().min(1)).min(1).max(200),
  days: z.number().int().positive().max(365),
  reason: z.string().min(1).max(300),
  generateInvoices: z.boolean().default(false),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'grant_pro_bulk', async (req2, { user: admin, ip, userAgent }) => {
      const data = schema.parse(await req2.json());
      const now = new Date();

      const results: Array<{ phone: string; ok: boolean; userId?: string; error?: string }> = [];
      let success = 0;
      let failed = 0;

      for (const phone of data.phones) {
        try {
          const target = await prisma.user.findUnique({ where: { phone } });
          if (!target) {
            results.push({ phone, ok: false, error: 'USER_NOT_FOUND' });
            failed++;
            continue;
          }
          const currentPro = target.proUntil && target.proUntil > now ? target.proUntil : now;
          const newPro = new Date(currentPro.getTime() + data.days * 86_400_000);

          const subscription = await prisma.$transaction(async (tx) => {
            await tx.user.update({ where: { id: target.id }, data: { proUntil: newPro } });
            return tx.subscription.create({
              data: { userId: target.id, source: 'ADMIN_GIFT', startsAt: now, endsAt: newPro, amountXaf: 0 },
            });
          });

          if (data.generateInvoices) {
            await generateSubscriptionInvoice(subscription.id).catch(() => {});
          }

          results.push({ phone, ok: true, userId: target.id });
          success++;
        } catch {
          results.push({ phone, ok: false, error: 'EXCEPTION' });
          failed++;
        }
      }

      await writeAudit({
        actorId: admin.id,
        targetId: null,
        action: 'admin_pro_granted_bulk',
        meta: { count: data.phones.length, success, failed, days: data.days, reason: data.reason },
        ip,
        userAgent,
      });

      return jsonOk({ success, failed, results });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

