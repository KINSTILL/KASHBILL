import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SubscriptionInvoicePdfInput } from './types';

const INVOICES_DIR = path.join(process.cwd(), 'uploads', 'subscription-invoices');

export async function renderSubscriptionInvoicePdf(input: SubscriptionInvoicePdfInput): Promise<string> {
  const { pdf } = await import('@react-pdf/renderer');
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
  const resolvedInput: SubscriptionInvoicePdfInput = {
    ...input,
    company: resolvedCompany,
  };

  const blob = await pdf(SubscriptionInvoiceDocument({ input: resolvedInput }) as unknown as Parameters<typeof pdf>[0]).toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  await mkdir(INVOICES_DIR, { recursive: true });
  const filename = `${input.number}.pdf`;
  const absolutePath = path.join(INVOICES_DIR, filename);
  await writeFile(absolutePath, buffer);

  return path.relative(process.cwd(), absolutePath);
}

