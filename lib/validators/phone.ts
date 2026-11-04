/**
 * Normalise un numéro camerounais en +2376XXXXXXXX.
 * Retourne null si invalide.
 */
export function normalizeCameroonPhone(input: string): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/[\s\-().]/g, '');
  if (!cleaned) return null;

  let digits: string;
  if (cleaned.startsWith('+237')) digits = cleaned.slice(4);
  else if (cleaned.startsWith('237')) digits = cleaned.slice(3);
  else if (cleaned.startsWith('0')) digits = cleaned.slice(1);
  else digits = cleaned;

  if (!/^6\d{8}$/.test(digits)) return null;
  return `+237${digits}`;
}

export function isValidCameroonPhone(input: string): boolean {
  return normalizeCameroonPhone(input) !== null;
}

