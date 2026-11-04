import { describe, it, expect } from 'vitest';
import {
  normalizeCameroonPhone,
  isValidCameroonPhone,
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

