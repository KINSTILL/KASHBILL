import { describe, it, expect } from 'vitest';
import {
  normalizeCameroonPhone,
  isValidCameroonPhone,
  normalizePhone,
  isValidPhone,
} from '@/lib/validators/phone';

describe('normalizeCameroonPhone', () => {
  it.each([
    ['699123456', '+237699123456'],
    ['0699123456', '+237699123456'],
    ['237699123456', '+237699123456'],
    ['+237699123456', '+237699123456'],
    ['+237 699 123 456', '+237699123456'],
    ['699-123-456', '+237699123456'],
    ['(237) 699.123.456', '+237699123456'],
  ])('normalise "%s" en "%s"', (input, expected) => {
    expect(normalizeCameroonPhone(input)).toBe(expected);
  });

  it.each([
    ['', null],
    ['abc', null],
    ['+237599123456', null], // commence par 5, pas 6
    ['69912345', null], // trop court
    ['6991234567', null], // trop long
    ['+23769912345a', null],
  ])('rejette "%s"', (input, expected) => {
    expect(normalizeCameroonPhone(input)).toBe(expected);
  });
});

describe('isValidCameroonPhone', () => {
  it('retourne true pour un numéro valide', () => {
    expect(isValidCameroonPhone('699123456')).toBe(true);
  });

  it('retourne false pour un numéro invalide', () => {
    expect(isValidCameroonPhone('12345')).toBe(false);
  });
});

describe('normalizePhone', () => {
  it.each([
    ['+237699123456', '+237699123456'],
    ['+2250701020304', '+2250701020304'],
    ['+221771234567', '+221771234567'],
    ['+33612345678', '+33612345678'],
    ['699123456', '+237699123456'],
  ])('normalise international "%s" en "%s"', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    ['', null],
    ['abc', null],
    ['123', null],
  ])('rejette numéro invalide "%s"', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('retourne true pour un numéro international valide', () => {
    expect(isValidPhone('+2250701020304')).toBe(true);
  });
});


