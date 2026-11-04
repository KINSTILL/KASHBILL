export function formatXaf(amount: number, currency = 'FCFA'): string {
  const formatted = new Intl.NumberFormat('fr-CM', {
    style: 'decimal',
    maximumFractionDigits: 0,
  })
    .format(Math.round(amount))
    .replace(/\s/g, '\u202F');
  return `${formatted}\u202F${currency}`;
}

export function formatDateShort(d: Date): string {
  return new Intl.DateTimeFormat('fr-CM', {
    timeZone: 'Africa/Douala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

