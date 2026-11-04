type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
let cleanupInterval: NodeJS.Timeout | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
  if (typeof cleanupInterval.unref === 'function') cleanupInterval.unref();
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  ensureCleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Rate limit multiple (téléphone + IP). Retourne le premier refus.
 */
export function checkMultipleLimits(
  checks: Array<{ key: string; limit: number; windowMs: number }>
): { allowed: true } | { allowed: false; resetAt: number } {
  for (const check of checks) {
    const result = rateLimit(check.key, check.limit, check.windowMs);
    if (!result.allowed) return { allowed: false, resetAt: result.resetAt };
  }
  return { allowed: true };
}

