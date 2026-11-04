import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('autorise les N premières requêtes', () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('bloque la 6e requête', () => {
    const key = `test-${Date.now()}-b`;
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    const result = rateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('isole les clés différentes', () => {
    const key1 = `test-${Date.now()}-c1`;
    const key2 = `test-${Date.now()}-c2`;
    for (let i = 0; i < 5; i++) rateLimit(key1, 5, 60_000);
    expect(rateLimit(key1, 5, 60_000).allowed).toBe(false);
    expect(rateLimit(key2, 5, 60_000).allowed).toBe(true);
  });
});

