import { env } from '@/lib/env';
import { generateQrCode } from '@/lib/documents/integrity';
import { SubscriptionInvoiceDocument } from '@/lib/pdf/subscription/SubscriptionInvoiceTemplate';
import { renderSubscriptionInvoicePdf } from '@/lib/pdf/subscription/render';
import type { SubscriptionInvoicePdfInput } from '@/lib/pdf/subscription/types';

export { SubscriptionInvoiceDocument, renderSubscriptionInvoicePdf };
export type { SubscriptionInvoicePdfInput };

/**
 * Générateur dédié pour la facture / reçu d'abonnement MyCashBill Pro.
 * Assure la présence du QR code de vérification (/verify/{token}) et les mentions légales conformes.
 */
export async function generateProSubscriptionPdf(
  input: SubscriptionInvoicePdfInput
): Promise<string> {
  const publicToken = input.publicToken || input.invoiceId || input.number;
  const qrCode = input.qrCode || (await generateQrCode(publicToken, env.APP_URL));

  return renderSubscriptionInvoicePdf({
    ...input,
    publicToken,
    qrCode,
  });
}
