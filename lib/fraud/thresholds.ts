import { prisma } from '@/lib/db';
import type { FraudThreshold } from '@prisma/client';

type CacheEntry = { value: FraudThreshold; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getThreshold(key: string): Promise<FraudThreshold | null> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const threshold = await prisma.fraudThreshold.findUnique({ where: { key } });
  if (threshold) {
    cache.set(key, { value: threshold, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  return threshold;
}

export async function getAllThresholds(): Promise<FraudThreshold[]> {
  return prisma.fraudThreshold.findMany({ orderBy: { key: 'asc' } });
}

export async function setThresholdValue(key: string, value: number, updatedById: string) {
  const current = await getThreshold(key);
  if (!current) throw new Error(`Threshold ${key} not found`);
  if (value < current.floor || value > current.ceiling) {
    throw new Error(
      `Value ${value} out of bounds [${current.floor}, ${current.ceiling}] for ${key}`
    );
  }
  const updated = await prisma.fraudThreshold.update({
    where: { key },
    data: { value, updatedById },
  });
  cache.delete(key);
  return updated;
}

export function invalidateThresholdCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

