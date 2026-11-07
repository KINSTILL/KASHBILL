export function formatCurrency(amount: number, currencyCode: string = 'XAF'): string {
  const rounded = Math.round(amount);
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
      .format(rounded)
      .replace(/\u202F|\u00A0/g, '\u00A0');
  } catch {
    const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
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

export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('fr-CM', {
    timeZone: 'Africa/Douala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}
