import { prisma } from '@/lib/db';
import type { DocType } from '@prisma/client';

/** Nombre maximum de suggestions retournées par type et par catégorie. */
export const MAX_SUGGESTIONS = 6;
/** Nombre de documents récents analysés (borne le coût de la requête). */
const HISTORY_SAMPLE = 300;

export type TypeSuggestions = {
  /** Motifs de paiement déjà saisis, du plus utilisé au moins utilisé. */
  paymentReferences: string[];
  /** Libellés d'articles déjà utilisés, du plus utilisé au moins utilisé. */
  articles: string[];
};

export type UserSuggestions = Partial<Record<DocType, TypeSuggestions>>;

type Usage = { label: string; count: number; lastUsed: number };

/** Ajoute un usage ; la clé est normalisée pour fusionner « Acompte » et « acompte ». */
function bump(map: Map<string, Usage>, raw: unknown, usedAt: number) {
  if (typeof raw !== 'string') return;
  const label = raw.trim().replace(/\s+/g, ' ');
  if (label.length === 0 || label.length > 200) return;
  const key = label.toLowerCase();
  const existing = map.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastUsed = Math.max(existing.lastUsed, usedAt);
  } else {
    map.set(key, { label, count: 1, lastUsed: usedAt });
  }
}

/** Trie par fréquence, puis par récence, et garde les N premiers libellés. */
function top(map: Map<string, Usage>): string[] {
  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, MAX_SUGGESTIONS)
    .map((u) => u.label);
}

/**
 * Construit les suggestions personnalisées d'un utilisateur, par type de document,
 * à partir de ses documents récents (motifs de paiement et libellés d'articles).
 * Aucun historique => le type n'apparaît pas dans le résultat.
 */
export async function getUserSuggestions(userId: string): Promise<UserSuggestions> {
  const docs = await prisma.document.findMany({
    where: { userId },
    select: { type: true, payload: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_SAMPLE,
  });

  const perType = new Map<DocType, { payments: Map<string, Usage>; articles: Map<string, Usage> }>();

  for (const doc of docs) {
    const payload = (doc.payload ?? {}) as {
      paymentReference?: unknown;
      lines?: Array<{ description?: unknown }>;
    };
    let bucket = perType.get(doc.type);
    if (!bucket) {
      bucket = { payments: new Map(), articles: new Map() };
      perType.set(doc.type, bucket);
    }
    const usedAt = doc.createdAt.getTime();
    bump(bucket.payments, payload.paymentReference, usedAt);
    for (const line of payload.lines ?? []) bump(bucket.articles, line?.description, usedAt);
  }

  const result: UserSuggestions = {};
  for (const [type, { payments, articles }] of perType) {
    const paymentReferences = top(payments);
    const articleLabels = top(articles);
    if (paymentReferences.length === 0 && articleLabels.length === 0) continue;
    result[type] = { paymentReferences, articles: articleLabels };
  }
  return result;
}
