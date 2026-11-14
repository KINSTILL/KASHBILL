import { ADDON_PRICES } from '@/lib/addons/queries';

export type InvoiceItem = { title: string; description: string };

/**
 * Libellé de la ligne de facture selon le montant payé.
 * Les montants des add-ons sont uniques (500 / 1000 / 3000), ils ne se confondent
 * pas avec les formules Pro (2000 / 5000 / 18000).
 */
export function invoiceItemFor(amountXaf: number, isFr: boolean): InvoiceItem | null {
  const byAmount: Record<number, InvoiceItem> = {
    [ADDON_PRICES.EXTRA_DEVICE]: {
      title: isFr ? 'Add-on — Appareil supplémentaire' : 'Add-on — Extra device',
      description: isFr ? 'Un appareil supplémentaire — 30 jours' : 'One extra device — 30 days',
    },
    [ADDON_PRICES.WHITE_LABEL]: {
      title: isFr ? 'Add-on — Marque blanche' : 'Add-on — White label',
      description: isFr ? 'Vos couleurs et votre logo sur les documents — 30 jours' : 'Your colours and logo on documents — 30 days',
    },
    3000: {
      title: isFr ? 'Add-on — Marque blanche' : 'Add-on — White label',
      description: isFr ? 'Vos couleurs et votre logo sur les documents — 30 jours' : 'Your colours and logo on documents — 30 days',
    },
  };
  return byAmount[amountXaf] ?? null;
}
