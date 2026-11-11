import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SubscriptionInvoicePdfInput } from './types';

const INVOICES_DIR = path.join(process.cwd(), 'uploads', 'subscription-invoices');

export async function renderSubscriptionInvoicePdf(input: SubscriptionInvoicePdfInput): Promise<string> {
  const { pdf, Font } = await import('@react-pdf/renderer');
  Font.registerHyphenationCallback((word) => [word]);
  const { SubscriptionInvoiceDocument } = await import('./SubscriptionInvoiceTemplate');

  const resolvedCompany = { ...input.company };
  if (resolvedCompany.logoUrl && !resolvedCompany.logoUrl.startsWith('http') && !resolvedCompany.logoUrl.startsWith('data:')) {
    const localPath = path.join(process.cwd(), 'public', resolvedCompany.logoUrl.replace(/^\//, ''));
    if (existsSync(localPath)) {
      try {
        const buf = readFileSync(localPath);
        resolvedCompany.logoUrl = `data:image/png;base64,${buf.toString('base64')}`;
      } catch {
        resolvedCompany.logoUrl = '';
      }
    } else {
      resolvedCompany.logoUrl = '';
    }
  }
  const publicToken = input.publicToken || input.invoiceId || input.number;
  let qrCode = input.qrCode;
  if (!qrCode) {
    try {
      const { generateQrCode } = await import('@/lib/documents/integrity');
      const { env } = await import('@/lib/env');
      qrCode = await generateQrCode(publicToken, env.APP_URL);
    } catch (e) {
      console.warn('[subscription-invoice] qr code generation failed', e);
    }
  }

  const resolvedInput: SubscriptionInvoicePdfInput = {
    ...input,
    company: resolvedCompany,
    publicToken,
    qrCode,
  };

  const blob = await pdf(SubscriptionInvoiceDocument({ input: resolvedInput }) as unknown as Parameters<typeof pdf>[0]).toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  await mkdir(INVOICES_DIR, { recursive: true });
  const filename = `${input.number}.pdf`;
  const absolutePath = path.join(INVOICES_DIR, filename);
  await writeFile(absolutePath, buffer);

  return path.relative(process.cwd(), absolutePath);
}

