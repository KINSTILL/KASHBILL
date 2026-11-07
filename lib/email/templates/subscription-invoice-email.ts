type Input = {
  locale: 'fr' | 'en';
  userName: string;
  invoiceNumber: string;
  amountFormatted: string;
  periodStart: string;
  periodEnd: string;
};

export function buildSubscriptionInvoiceEmail(input: Input) {
  const isFr = input.locale === 'fr';
  const subject = isFr
    ? `Votre facture MyCashBill Pro — ${input.invoiceNumber}`
    : `Your MyCashBill Pro invoice — ${input.invoiceNumber}`;
  const greeting = isFr ? `Bonjour ${input.userName},` : `Hello ${input.userName},`;
  const intro = isFr
    ? "Merci pour votre paiement. Veuillez trouver ci-joint votre facture d'abonnement MyCashBill Pro."
    : 'Thank you for your payment. Please find attached your MyCashBill Pro subscription invoice.';
  const summary = isFr
    ? `Facture n° ${input.invoiceNumber} — Montant : ${input.amountFormatted} — Période : du ${input.periodStart} au ${input.periodEnd}.`
    : `Invoice No. ${input.invoiceNumber} — Amount: ${input.amountFormatted} — Period: from ${input.periodStart} to ${input.periodEnd}.`;
  const footer = isFr
    ? 'Document émis électroniquement par MyCashBill.'
    : 'Electronically issued by MyCashBill.';

  const html = `<!doctype html><html lang="${input.locale}"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#FAFBFC;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#0B1220;">
<table role="presentation" width="100%" style="padding:24px 0;"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:12px;padding:32px;"><tr><td>
<div style="height:3px;background:#B8935A;margin-bottom:24px;"></div>
<h1 style="margin:0 0 16px;font-size:18px;font-weight:600;">MyCashBill Pro</h1>
<p style="margin:0 0 8px;font-size:14px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 8px;font-size:14px;">${escapeHtml(intro)}</p>
<div style="margin:16px 0;padding:12px;background:#FAFBFC;border-left:3px solid #B8935A;border-radius:4px;">
<p style="margin:0;font-size:13px;color:#334155;">${escapeHtml(summary)}</p>
</div>
<p style="margin:24px 0 0;font-size:14px;">${isFr ? 'Cordialement' : 'Best regards'},<br/>MyCashBill</p>
<hr style="margin:32px 0 16px;border:none;border-top:1px solid #E2E8F0;">
<p style="margin:0;font-size:11px;color:#94A3B8;">${escapeHtml(footer)}</p>
</td></tr></table></td></tr></table></body></html>`;

  const text = `${greeting}\n\n${intro}\n\n${summary}\n\n${isFr ? 'Cordialement' : 'Best regards'},\nMyCashBill\n\n${footer}`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

