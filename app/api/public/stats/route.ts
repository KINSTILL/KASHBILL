import { prisma } from '@/lib/db';
import { jsonOk } from '@/lib/api-helpers';

// Cache 1 heure — la DB n'est frappée qu'une fois par heure
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  try {
    const count = await prisma.document.count();
    const res = jsonOk({ documentsGenerated: count });
    res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res;
  } catch {
    const fallback = jsonOk({ documentsGenerated: 0 });
    fallback.headers.set('Cache-Control', 'public, s-maxage=300');
    return fallback;
  }
}
