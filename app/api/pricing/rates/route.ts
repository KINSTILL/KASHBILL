import { getLiveRates } from '@/lib/pricing/rates';

export const runtime = 'nodejs';

/** Taux indicatifs publics (aucune donnée personnelle). */
export async function GET(): Promise<Response> {
  const snapshot = await getLiveRates();
  return Response.json(
    {
      approximate: true,
      rates: snapshot?.rates ?? null,
      updatedAt: snapshot?.updatedAt ?? null,
      source: snapshot ? 'Rates By Exchange Rate API' : null,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
      },
    }
  );
}
