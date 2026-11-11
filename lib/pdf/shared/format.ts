export function formatCurrency(
  amount: number,
  currencyCode: string = 'XAF',
  locale: 'FR' | 'EN' | string = 'FR'
): string {
  const rounded = Math.round(amount);
  const loc = String(locale).toUpperCase() === 'EN' ? 'en-US' : 'fr-FR';
  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
      .format(rounded)
      .replace(/\u202F|\u00A0/g, '\u00A0');
  } catch {
    const formatted = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 })
      .format(rounded)
      .replace(/\s/g, '\u00A0');
    return `${formatted}\u00A0${currencyCode}`;
  }
}

/** @deprecated Utiliser formatCurrency */
export function formatXaf(amount: number, currencyOrCode = 'XAF'): string {
  // Backward compat : anciens appels passaient 'FCFA' ou un code ISO
  const code = currencyOrCode === 'FCFA' ? 'XAF' : currencyOrCode;
  return formatCurrency(amount, code);
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
