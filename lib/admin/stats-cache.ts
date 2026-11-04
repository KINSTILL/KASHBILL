type CacheEntry<T> = { value: T; expiresAt: number };
let cache: CacheEntry<unknown> | null = null;

export function getCached<T>(): T | null {
  if (cache && cache.expiresAt > Date.now()) return cache.value as T;
  return null;
}

export function setCached<T>(value: T, ttlMs = 60_000): void {
  cache = { value, expiresAt: Date.now() + ttlMs };
}

export function invalidateStatsCache(): void {
  cache = null;
}

