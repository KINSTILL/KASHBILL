import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { buildSubscriptionInvoiceEmail } from '@/lib/email/templates/subscription-invoice-email';

export type SendEmailResult =
  | { ok: true }
  | { ok: false; reason: 'DISABLED' | 'NO_EMAIL' | 'ALREADY_SENT' | 'NO_PDF' | 'SEND_ERROR' };

export async function sendSubscriptionInvoiceEmail(invoiceId: string): Promise<SendEmailResult> {
  // 1. Skip si Resend non configuré (aucun secret requis)
  if (env.RESEND_ENABLED !== 'true' || !env.RESEND_API_KEY) {
    return { ok: false, reason: 'DISABLED' };
  }

  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
    include: { user: true },
  });
  if (!invoice) return { ok: false, reason: 'SEND_ERROR' };
  if (invoice.sentByEmailAt) return { ok: false, reason: 'ALREADY_SENT' };
  if (!invoice.user.email) return { ok: false, reason: 'NO_EMAIL' };
  if (!invoice.pdfPath) return { ok: false, reason: 'NO_PDF' };

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);
    const buffer = await readFile(path.join(process.cwd(), invoice.pdfPath));
    const isFr = invoice.locale === 'FR';

    const fmt = (n: number) =>
      `${new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 0 }).format(n)} FCFA`;

    const fmtDate = (d: Date) =>
      new Intl.DateTimeFormat(isFr ? 'fr-FR' : 'en-GB', {
        timeZone: 'Africa/Douala',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);

    const tpl = buildSubscriptionInvoiceEmail({
      locale: isFr ? 'fr' : 'en',
      userName: invoice.user.name ?? invoice.user.businessName ?? invoice.user.phone,
      invoiceNumber: invoice.number,
      amountFormatted: fmt(invoice.totalXaf),
      periodStart: fmtDate(invoice.periodStart),
      periodEnd: fmtDate(invoice.periodEnd),
    });

    const from = env.RESEND_FROM_NAME
      ? `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`
      : env.RESEND_FROM_EMAIL;

    const result = await resend.emails.send({
      from,
      to: [invoice.user.email],
      replyTo: env.RESEND_REPLY_TO || undefined,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      attachments: [{ filename: `${invoice.number}.pdf`, content: buffer }],
    });

    if (result.error) return { ok: false, reason: 'SEND_ERROR' };

    await prisma.subscriptionInvoice.update({
      where: { id: invoiceId },
      data: { sentByEmailAt: new Date() },
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'SEND_ERROR' };
  }
}

