import { prisma } from '@/lib/db';

type CacheEntry = { isBlacklisted: boolean; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export type BlacklistType = 'PHONE' | 'TAX_ID' | 'DOCUMENT_HASH';

export async function isBlacklisted(type: BlacklistType, value: string): Promise<boolean> {
  const key = `${type}:${value}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.isBlacklisted;

  const entry = await prisma.blacklistEntry.findUnique({
    where: { type_value: { type, value } },
  });
  const isBlack = entry !== null;
  cache.set(key, { isBlacklisted: isBlack, expiresAt: Date.now() + CACHE_TTL_MS });
  return isBlack;
}

export async function addToBlacklist(
  type: BlacklistType,
  value: string,
  reason: string,
  createdById: string
) {
  const entry = await prisma.blacklistEntry.create({
    data: { type, value, reason, createdById },
  });
  cache.delete(`${type}:${value}`);
  return entry;
}

export function invalidateBlacklistCache(type?: BlacklistType, value?: string) {
  if (type && value) cache.delete(`${type}:${value}`);
  else cache.clear();
}

