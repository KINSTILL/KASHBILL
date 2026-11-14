/**
 * Nombre de décimales autorisées sur les documents.
 * Lié au champ `User.decimalPlaces`. Défaut 0 (conformité XAF).
 */
export type DecimalPlaces = 0 | 1 | 2;

export function formatCurrency(
  amount: number,
  currencyCode: string = 'XAF',
  locale: 'FR' | 'EN' | string = 'FR',
  decimals: DecimalPlaces = 0
): string {
  const digits: DecimalPlaces = decimals === 1 || decimals === 2 ? decimals : 0;
  // Sans décimales : arrondi au franc (comportement historique). Avec : on préserve les centimes.
  const value = digits === 0 ? Math.round(amount) : amount;
  const loc = String(locale).toUpperCase() === 'EN' ? 'en-US' : 'fr-FR';
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    })
      .format(value)
      .replace(/\u202F|\u00A0/g, '\u00A0');
  } catch {
    const formatted = new Intl.NumberFormat(loc, {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    })
      .format(value)
      .replace(/\s/g, '\u00A0');
    return `${formatted}\u00A0${currencyCode}`;
  }
}

/** Symbole / code de la devise tel qu'affiché par formatCurrency (ex. « FCFA », « XAF », « € »). */
export function currencyLabel(
  currencyCode: string = 'XAF',
  locale: 'FR' | 'EN' | string = 'FR'
): string {
  const loc = String(locale).toUpperCase() === 'EN' ? 'en-US' : 'fr-FR';
  try {
    const parts = new Intl.NumberFormat(loc, { style: 'currency', currency: currencyCode }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? currencyCode;
  } catch {
    return currencyCode;
  }
}

/** Montant seul, sans devise (colonnes de tableau). Espaces insécables : jamais de retour à la ligne au milieu. */
export function formatAmount(
  amount: number,
  locale: 'FR' | 'EN' | string = 'FR',
  decimals: DecimalPlaces = 0
): string {
  const digits: DecimalPlaces = decimals === 1 || decimals === 2 ? decimals : 0;
  const value = digits === 0 ? Math.round(amount) : amount;
  const loc = String(locale).toUpperCase() === 'EN' ? 'en-US' : 'fr-FR';
  return new Intl.NumberFormat(loc, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
    .format(value)
    .replace(/\s/g, '\u00A0');
}

/** @deprecated Utiliser formatCurrency */
export function formatXaf(
  amount: number,
  currencyOrCode = 'XAF',
  decimals: DecimalPlaces = 0
): string {
  // Backward compat : anciens appels passaient 'FCFA' ou un code ISO
  const code = currencyOrCode === 'FCFA' ? 'XAF' : currencyOrCode;
  return formatCurrency(amount, code, 'FR', decimals);
}

export function formatDateShort(d: Date | string, locale: 'FR' | 'EN' | string = 'FR'): string {
  const dateObj = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dateObj.getTime())) return '';
  const loc = String(locale).toUpperCase() === 'EN' ? 'en-US' : 'fr-CM';
  return new Intl.DateTimeFormat(loc, {
    timeZone: 'Africa/Douala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}
