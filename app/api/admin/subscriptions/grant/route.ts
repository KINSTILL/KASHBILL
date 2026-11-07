import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { generateSubscriptionInvoice } from '@/lib/subscriptions/generate-invoice';
import { sendSubscriptionInvoiceEmail } from '@/lib/subscriptions/send-invoice-email';

const schema = z.object({
  userId: z.string().min(1),
  days: z.number().int().positive().max(365),
  reason: z.string().min(1).max(300),
  generateInvoice: z.boolean().default(true),
  sendEmail: z.boolean().default(false),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'grant_pro_bulk', async (req2, { user: admin, ip, userAgent }) => {
      const body = await req2.json();
      const data = schema.parse(body);

      const target = await prisma.user.findUnique({ where: { id: data.userId } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);

      const now = new Date();
      const currentPro = target.proUntil && target.proUntil > now ? target.proUntil : now;
      const newPro = new Date(currentPro.getTime() + data.days * 86_400_000);

      // Créer la Subscription
      const subscription = await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: target.id }, data: { proUntil: newPro } });
        return tx.subscription.create({
          data: {
            userId: target.id,
            source: 'ADMIN_GIFT',
            startsAt: now,
            endsAt: newPro,
            amountXaf: 0,
          },
        });
      });

      let invoiceId: string | null = null;
      let invoiceNumber: string | null = null;
      let emailSent = false;

      if (data.generateInvoice) {
        const invResult = await generateSubscriptionInvoice(subscription.id);
        if (invResult.ok) {
          invoiceId = invResult.invoiceId;
          invoiceNumber = invResult.number;
          if (data.sendEmail && target.email) {
            const emailResult = await sendSubscriptionInvoiceEmail(invResult.invoiceId);
            emailSent = emailResult.ok;
          }
        }
      }

      await writeAudit({
        actorId: admin.id,
        targetId: target.id,
        action: 'admin_pro_granted_manual',
        meta: { days: data.days, reason: data.reason, invoiceId, emailSent, newProUntil: newPro.toISOString() },
        ip,
        userAgent,
      });

      return jsonOk({
        ok: true,
        proUntil: newPro,
        subscriptionId: subscription.id,
        invoiceId,
        invoiceNumber,
        emailSent,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

