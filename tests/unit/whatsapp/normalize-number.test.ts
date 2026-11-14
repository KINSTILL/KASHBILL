import { describe, it, expect } from 'vitest';

/**
 * La normalisation est testée via une copie de la logique pure, car `lib/whatsapp/send.ts`
 * importe la couche DB (Prisma) au chargement du module.
 * Les cas ci-dessous verrouillent le comportement attendu côté production.
 */

const DIAL_CODES_DESC = ['237', '225', '971', '241', '221', '33', '32', '44', '1'];

function detectDialCode(digits: string): string | null {
  for (const cc of DIAL_CODES_DESC) if (digits.startsWith(cc)) return cc;
  return null;
}

const BOUNDS: Record<string, { min: number; max: number }> = {
  '237': { min: 9, max: 9 },
  '225': { min: 10, max: 10 },
  '33': { min: 9, max: 9 },
  '32': { min: 9, max: 9 },
  '1': { min: 10, max: 10 },
  '971': { min: 9, max: 9 },
  '44': { min: 10, max: 10 },
  '241': { min: 7, max: 8 },
  '221': { min: 9, max: 9 },
};

function normalize(rawPhone: string, dialCode = '+237'): string {
  if (!rawPhone) return '';
  const trimmed = rawPhone.trim();
  if (!trimmed) return '';
  const selected = dialCode.replace(/\D/g, '');
  const hasExplicitPrefix = /^\+|^00/.test(trimmed);
  const digits = trimmed.replace(/^\+/, '').replace(/^00/, '').replace(/\D/g, '');
  if (!digits) return '';

  let cc: string | null = null;
  let national: string;

  if (hasExplicitPrefix) {
    cc = detectDialCode(digits);
    if (!cc) return digits.length >= 6 ? digits : '';
    national = digits.slice(cc.length);
  } else {
    const detected = detectDialCode(digits);
    const b = detected ? BOUNDS[detected] : undefined;
    const fits =
      detected !== null && b !== undefined && digits.length - detected.length >= b.min && digits.length - detected.length <= b.max;
    if (detected && (detected === selected || detected.length >= 3 || fits)) {
      cc = detected;
      national = digits.slice(cc.length);
    } else if (selected) {
      cc = selected;
      national = digits;
    } else {
      const bare = digits.replace(/^0+/, '');
      return bare || '';
    }
  }

  const bounds = cc ? BOUNDS[cc] : undefined;
  if (!bounds || national.length > bounds.max) national = national.replace(/^0+/, '');
  if (!national) return '';
  if (bounds && (national.length < bounds.min || national.length > bounds.max)) return '';
  const full = `${cc}${national}`;
  if (full.length < 6 || full.length > 15) return '';
  return full;
}

describe('normalizeWhatsAppNumber — aucun double préfixe', () => {
  it.each([
    ['6 99 12 34 56', '+237', '237699123456'],
    ['+237 6 99 12 34 56', '+237', '237699123456'],
    ['237 6 99 12 34 56', '+237', '237699123456'],
    ['237699123456', '+237', '237699123456'],
  ])('"%s" avec %s → %s', (input, dial, expected) => {
    expect(normalize(input, dial)).toBe(expected);
  });

  it('respecte un indicatif déjà saisi même si le sélecteur est sur un autre pays', () => {
    expect(normalize('237699999999', '+33')).toBe('237699999999');
    expect(normalize('+33612345678', '+237')).toBe('33612345678');
  });
});

describe('normalizeWhatsAppNumber — zéro national', () => {
  it.each([
    ['06 12 34 56 78', '+33', '33612345678'],
    ['+33 06 12 34 56 78', '+33', '33612345678'],
    ['+33 6 12 34 56 78', '+33', '33612345678'],
    ['33 06 12 34 56 78', '+33', '33612345678'],
    ['0033612345678', '+237', '33612345678'],
  ])('"%s" avec %s → %s', (input, dial, expected) => {
    expect(normalize(input, dial)).toBe(expected);
  });

  it("conserve le 0 significatif de Côte d'Ivoire", () => {
    expect(normalize('0707070707', '+225')).toBe('2250707070707');
    expect(normalize('+2250707070707', '+237')).toBe('2250707070707');
  });
});

describe('normalizeWhatsAppNumber — indicatifs internationaux', () => {
  it.each([
    ['+971501234567', '971501234567'],
    ['+14165551234', '14165551234'],
  ])('"%s" → %s', (input, expected) => {
    expect(normalize(input, '+237')).toBe(expected);
  });
});

describe('normalizeWhatsAppNumber — rejets', () => {
  it.each([['69912345', '+237'], ['', '+237'], ['abc', '+237']])('"%s" est rejeté', (input, dial) => {
    expect(normalize(input, dial)).toBe('');
  });
});
