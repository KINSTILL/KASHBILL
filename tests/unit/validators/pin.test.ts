import { describe, it, expect } from 'vitest';
import { isValidPin, pinMatches } from '@/lib/validators/pin';

describe('isValidPin', () => {
  it('accepte 6 chiffres', () => {
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('000000')).toBe(true);
  });

  it.each(['', '12345', '1234567', 'abcdef', '12 34 56', '12-34-56'])(
    'rejette "%s"',
    (pin) => {
      expect(isValidPin(pin)).toBe(false);
    }
  );
});

describe('pinMatches', () => {
  it('retourne true si identiques et valides', () => {
    expect(pinMatches('123456', '123456')).toBe(true);
  });

  it('retourne false si différents', () => {
    expect(pinMatches('123456', '654321')).toBe(false);
  });

  it('retourne false si invalides', () => {
    expect(pinMatches('12345', '12345')).toBe(false);
  });
});

