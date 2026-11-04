import { describe, it, expect } from 'vitest';
import { formatFCFA, formatDate, canonicalStringify } from '@/lib/utils';

describe('formatFCFA', () => {
  it('formate 0', () => {
    expect(formatFCFA(0)).toBe('0\u202F FCFA'.replace(' ', ''));
  });

  it('formate 1000 avec espace insécable U+202F', () => {
    const result = formatFCFA(1000);
    expect(result).toContain('\u202F');
    expect(result).toBe('1\u202F000\u202FFCFA');
  });

  it('formate 1234567', () => {
    expect(formatFCFA(1234567)).toBe('1\u202F234\u202F567\u202FFCFA');
  });

  it('arrondit les décimales', () => {
    expect(formatFCFA(1234.56)).toContain('1\u202F235');
  });
});

describe('formatDate', () => {
  const date = new Date('2026-03-15T12:00:00Z');

  it('formate en FR (DD/MM/YYYY)', () => {
    expect(formatDate(date, 'fr')).toBe('15/03/2026');
  });

  it('formate en EN (MM/DD/YYYY)', () => {
    expect(formatDate(date, 'en')).toBe('03/15/2026');
  });
});

describe('canonicalStringify', () => {
  it('trie les clés récursivement', () => {
    const a = canonicalStringify({ b: 1, a: 2 });
    const b = canonicalStringify({ a: 2, b: 1 });
    expect(a).toBe(b);
  });

  it('est déterministe sur des structures imbriquées', () => {
    const obj1 = { z: { c: 3, b: 2 }, a: 1 };
    const obj2 = { a: 1, z: { b: 2, c: 3 } };
    expect(canonicalStringify(obj1)).toBe(canonicalStringify(obj2));
  });

  it('gère les tableaux', () => {
    expect(canonicalStringify([3, 1, 2])).toBe('[3,1,2]');
  });

  it('gère null et primitives', () => {
    expect(canonicalStringify(null)).toBe('null');
    expect(canonicalStringify('hello')).toBe('"hello"');
    expect(canonicalStringify(42)).toBe('42');
  });
});

