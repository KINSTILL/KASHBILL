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

/**
 * Normalise un numéro de téléphone international (E.164) ou camerounais.
 * Retourne null si invalide.
 */
export function normalizePhone(input: string): string | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/[\s\-().]/g, '');
  if (!cleaned) return null;

  // Compatibilité prioritaire numéro camerounais (699..., 0699..., 237699..., +2370699...)
  const cm = normalizeCameroonPhone(cleaned);
  if (cm) return cm;

  // Format international E.164 (+ suivi d'un indicatif et de 6 à 14 chiffres)
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return cleaned;
  }

  // Si indicatif sans '+' mais avec 8 à 15 chiffres
  if (/^[1-9]\d{7,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}
