import type { LiveRates } from './currencies';

/**
 * Taux de change indicatifs, récupérés côté serveur (jamais depuis le navigateur).
 * Source : open.er-api.com (gratuit, sans clé). Attribution obligatoire :
 * « Rates By Exchange Rate API » (https://www.exchangerate-api.com).
 * En cas d'échec, on renvoie null : l'interface n'affiche alors que les devises à parité fixe.
 */

const RATES_URL = 'https://open.er-api.com/v6/latest/XAF';
const CACHE_MS = 12 * 60 * 60 * 1000;
const WANTED = ['USD', 'GHS', 'KES', 'UGX'] as const;

export type RatesSnapshot = {
  rates: LiveRates;
  updatedAt: string;
  source: 'exchangerate-api';
};

let cache: { at: number; data: RatesSnapshot | null } | null = null;

export async function getLiveRates(): Promise<RatesSnapshot | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  try {
    const res = await fetch(RATES_URL, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 12 * 60 * 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as {
      result?: string;
      time_last_update_utc?: string;
      rates?: Record<string, number>;
    };
    if (body.result !== 'success' || !body.rates) throw new Error('réponse inattendue');

    const rates: LiveRates = {};
    for (const code of WANTED) {
      const value = body.rates[code];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) rates[code] = value;
    }
    const data: RatesSnapshot = {
      rates,
      updatedAt: body.time_last_update_utc ?? new Date().toUTCString(),
      source: 'exchangerate-api',
    };
    cache = { at: Date.now(), data };
    return data;
  } catch {
    // Repli : on garde le dernier taux connu s'il existe, sinon rien (pas de chiffre inventé).
    if (cache?.data) return cache.data;
    cache = { at: Date.now(), data: null };
    return null;
  }
}
