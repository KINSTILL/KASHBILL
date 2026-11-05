export function formatXaf(amount: number, currency = 'FCFA'): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(rounded)
    .replace(/\s/g, '\u00A0');
  return `${formatted}\u00A0${currency}`;
}

export const formatCurrency = formatXaf;

export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('fr-CM', {
    timeZone: 'Africa/Douala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

