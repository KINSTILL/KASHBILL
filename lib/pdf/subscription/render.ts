import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SubscriptionInvoicePdfInput } from './types';

const INVOICES_DIR = path.join(process.cwd(), 'uploads', 'subscription-invoices');

export async function renderSubscriptionInvoicePdf(input: SubscriptionInvoicePdfInput): Promise<string> {
  const { pdf } = await import('@react-pdf/renderer');
  const { SubscriptionInvoiceDocument } = await import('./SubscriptionInvoiceTemplate');

  const blob = await pdf(SubscriptionInvoiceDocument({ input }) as unknown as Parameters<typeof pdf>[0]).toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  await mkdir(INVOICES_DIR, { recursive: true });
  const filename = `${input.number}.pdf`;
  const absolutePath = path.join(INVOICES_DIR, filename);
  await writeFile(absolutePath, buffer);

  return path.relative(process.cwd(), absolutePath);
}

