/**
 * Devises d'affichage (indicatif). Le paiement reste toujours en FCFA.
 * - XAF / XOF : parité fixe avec le FCFA (même valeur).
 * - EUR : parité fixe 1 € = 655,957 FCFA (garantie par la Banque de France / BCEAO).
 * - USD, GHS, KES, UGX : taux en ligne (approximatif), avec repli si indisponible.
 */

export const FCFA_PER_EUR = 655.957;

export type DisplayCurrency = {
  code: 'XAF' | 'XOF' | 'EUR' | 'USD' | 'GHS' | 'KES' | 'UGX';
  label: string;
  /** Unités de la devise pour 1 FCFA (taux fixe), sinon null = taux en ligne. */
  fixedPerXaf: number | null;
  /** Décimales affichées. */
  decimals: 0 | 2;
  /** Affichage du symbole. */
  symbol: string;
};

export const DISPLAY_CURRENCIES: DisplayCurrency[] = [
  { code: 'XAF', label: 'FCFA', fixedPerXaf: 1, decimals: 0, symbol: 'FCFA' },
  { code: 'XOF', label: 'XOF', fixedPerXaf: 1, decimals: 0, symbol: 'XOF' },
  { code: 'EUR', label: '€', fixedPerXaf: 1 / FCFA_PER_EUR, decimals: 2, symbol: '€' },
  { code: 'USD', label: '$', fixedPerXaf: null, decimals: 2, symbol: '$' },
  { code: 'GHS', label: 'GH₵', fixedPerXaf: null, decimals: 0, symbol: 'GH₵' },
  { code: 'KES', label: 'KSh', fixedPerXaf: null, decimals: 0, symbol: 'KSh' },
  { code: 'UGX', label: 'USh', fixedPerXaf: null, decimals: 0, symbol: 'USh' },
];

/** Taux en ligne : unités de devise pour 1 FCFA. */
export type LiveRates = Partial<Record<DisplayCurrency['code'], number>>;

/**
 * Convertit un montant FCFA dans une devise.
 * Retourne null si le taux n'est pas disponible (devise masquée plutôt qu'un chiffre faux).
 */
export function convertFromXaf(
  amountXaf: number,
  currency: DisplayCurrency,
  live: LiveRates | null
): number | null {
  const perXaf = currency.fixedPerXaf ?? live?.[currency.code] ?? null;
  if (perXaf == null || !Number.isFinite(perXaf) || perXaf <= 0) return null;
  const raw = amountXaf * perXaf;
  const factor = currency.decimals === 0 ? 1 : 100;
  return Math.round(raw * factor) / factor;
}

/** Formate un montant converti pour l'affichage (sans symbole « FCFA » répété). */
export function formatConverted(value: number, currency: DisplayCurrency, locale: string): string {
  const loc = locale === 'en' ? 'en-US' : 'fr-FR';
  const number = new Intl.NumberFormat(loc, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(value);
  return currency.code === 'USD' ? `$${number}` : `${number} ${currency.label}`;
}
