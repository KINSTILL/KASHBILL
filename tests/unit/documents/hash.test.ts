import { describe, it, expect } from 'vitest';
import { computeContentHash } from '@/lib/documents/hash';

const baseInput = {
  userId: 'user_123',
  docType: 'FACTURE',
  number: 'MCB-2026-000001',
  locale: 'FR',
  payload: { items: [{ name: 'Item 1', qty: 2 }], total: 1000 },
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('computeContentHash', () => {
  it('retourne un hash SHA-256 (64 hex chars)', () => {
    const h = computeContentHash(baseInput);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('est déterministe (mêmes entrées → même hash)', () => {
    const h1 = computeContentHash(baseInput);
    const h2 = computeContentHash(baseInput);
    expect(h1).toBe(h2);
  });

  it('est déterministe même si les clés du payload sont dans un ordre différent', () => {
    const h1 = computeContentHash(baseInput);
    const h2 = computeContentHash({
      ...baseInput,
      payload: { total: 1000, items: [{ qty: 2, name: 'Item 1' }] },
    });
    expect(h1).toBe(h2);
  });

  it('change si le payload change', () => {
    const h1 = computeContentHash(baseInput);
    const h2 = computeContentHash({
      ...baseInput,
      payload: { ...baseInput.payload, total: 2000 },
    });
    expect(h1).not.toBe(h2);
  });

  it('change si le numéro change', () => {
    const h1 = computeContentHash(baseInput);
    const h2 = computeContentHash({ ...baseInput, number: 'MCB-2026-000002' });
    expect(h1).not.toBe(h2);
  });
});

