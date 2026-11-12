import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en FCFA, avec espace insécable U+202F.
 * Par défaut (0 décimal) : arrondi au franc. `decimals` = 1 ou 2 pour préserver des centimes.
 * Exemple : formatFCFA(1234567) === "1 234 567 FCFA"
 */
export function formatFCFA(amount: number, decimals: 0 | 1 | 2 = 0): string {
  const digits = decimals === 1 || decimals === 2 ? decimals : 0;
  const formatter = new Intl.NumberFormat('fr-CM', {
    style: 'decimal',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
  const formatted = formatter.format(digits === 0 ? Math.round(amount) : amount);
  const withNbsp = formatted.replace(/\s/g, '\u202F');
  return `${withNbsp}\u202FFCFA`;
}

/**
 * Formate une date en timezone Africa/Douala, format court.
 */
export function formatDate(date: Date, locale: 'fr' | 'en'): string {
  const d = new Intl.DateTimeFormat('fr-CM', {
    timeZone: 'Africa/Douala',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .split('/');
  if (locale === 'fr') return `${d[0]}/${d[1]}/${d[2]}`;
  return `${d[1]}/${d[0]}/${d[2]}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sérialisation canonique d'un objet (clés triées récursivement).
 * Utilisée pour le hash d'intégrité des documents.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify((value as Record<string, unknown>)[k])}`);
  return `{${pairs.join(',')}}`;
}

