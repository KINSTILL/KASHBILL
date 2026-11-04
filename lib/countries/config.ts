import { prisma } from '@/lib/db';
import type { CountryTaxConfig } from '@prisma/client';

type CacheEntry = { value: CountryTaxConfig; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getCountryConfig(
  countryCode: string
): Promise<CountryTaxConfig | null> {
  const cached = cache.get(countryCode);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const config = await prisma.countryTaxConfig.findUnique({
    where: { countryCode },
  });
  if (config && config.isActive) {
    cache.set(countryCode, { value: config, expiresAt: Date.now() + CACHE_TTL_MS });
    return config;
  }
  return null;
}

export async function getActiveCountries(): Promise<CountryTaxConfig[]> {
  return prisma.countryTaxConfig.findMany({
    where: { isActive: true },
    orderBy: { countryNameFr: 'asc' },
  });
}

export function invalidateCountryCache(countryCode?: string) {
  if (countryCode) cache.delete(countryCode);
  else cache.clear();
}

