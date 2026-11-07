import { prisma } from '@/lib/db';
import { getPlatformCompany } from '@/lib/platform/company';
import { generateSubscriptionInvoiceNumber } from './invoice-number';
import { renderSubscriptionInvoicePdf } from '@/lib/pdf/subscription/render';

export type GenerateInvoiceResult =
  | { ok: true; invoiceId: string; number: string; pdfPath: string }
  | { ok: false; reason: 'ALREADY_EXISTS' | 'SUB_NOT_FOUND' | 'PDF_ERROR' | 'DB_ERROR' };

export async function generateSubscriptionInvoice(
  subscriptionId: string
): Promise<GenerateInvoiceResult> {
  const existing = await prisma.subscriptionInvoice.findUnique({ where: { subscriptionId } });
  if (existing) {
    return {
      ok: true,
      invoiceId: existing.id,
      number: existing.number,
      pdfPath: existing.pdfPath ?? '',
    };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true },
  });
  if (!subscription) return { ok: false, reason: 'SUB_NOT_FOUND' };

  const user = subscription.user;
  const company = getPlatformCompany();
  const amount = subscription.amountXaf ?? 2000;
  const vatRate = company.vatRegistered ? company.vatRate : null;
  const vatAmount = vatRate ? Math.round(amount * (vatRate / 100)) : null;
  const total = amount + (vatAmount ?? 0);
  const paidAt = subscription.startsAt;
  const year = paidAt.getFullYear();

  let invoiceId: string;
  let number: string;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const num = await generateSubscriptionInvoiceNumber(tx, year);
      const invoice = await tx.subscriptionInvoice.create({
        data: {
          subscriptionId,
          userId: user.id,
          number: num,
          locale: user.locale,
          amountXaf: amount,
          vatRate: vatRate !== null ? vatRate : null,
          vatAmountXaf: vatAmount,
          totalXaf: total,
          paymentRef: subscription.providerRef,
          paymentMethod: 'Notch Pay',
          paidAt,
          periodStart: subscription.startsAt,
          periodEnd: subscription.endsAt,
        },
      });
      return { id: invoice.id, number: invoice.number };
    });
    invoiceId = result.id;
    number = result.number;
  } catch {
    return { ok: false, reason: 'DB_ERROR' };
  }

  try {
    const pdfPath = await renderSubscriptionInvoicePdf({
      invoiceId,
      number,
      user,
      subscription,
      company,
      amount,
      vatRate,
      vatAmount,
      total,
      paidAt,
    });
    await prisma.subscriptionInvoice.update({
      where: { id: invoiceId },
      data: { pdfPath },
    });
    return { ok: true, invoiceId, number, pdfPath };
  } catch (e) {
    console.error('[subscription-invoice] pdf error', e);
    return { ok: false, reason: 'PDF_ERROR' };
  }
}

