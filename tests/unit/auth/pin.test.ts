import { describe, it, expect } from 'vitest';
import { hashPin, verifyPin } from '@/lib/auth/pin';

describe('hashPin', () => {
  it('produit un hash différent à chaque appel (salt)', async () => {
    const h1 = await hashPin('123456');
    const h2 = await hashPin('123456');
    expect(h1).not.toBe(h2);
  });

  it('produit un hash argon2id commençant par $argon2id$', async () => {
    const h = await hashPin('123456');
    expect(h.startsWith('$argon2id$')).toBe(true);
  });
});

describe('verifyPin', () => {
  it('retourne true pour le bon PIN', async () => {
    const h = await hashPin('123456');
    expect(await verifyPin(h, '123456')).toBe(true);
  });

  it('retourne false pour un mauvais PIN', async () => {
    const h = await hashPin('123456');
    expect(await verifyPin(h, '654321')).toBe(false);
  });

  it('retourne false pour un hash invalide', async () => {
    expect(await verifyPin('not-a-hash', '123456')).toBe(false);
  });
});

