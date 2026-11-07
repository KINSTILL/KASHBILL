import type { Prisma } from '@prisma/client';
import { DOCUMENT_NUMBER_PREFIX, DOCUMENT_NUMBER_PADDING } from '@/lib/constants';

/**
 * Génère un numéro de document séquentiel par (userId, prefix, year).
 * Auto-réparant : si le numéro calculé existe déjà dans Document, on incrémente
 * jusqu'à trouver un numéro libre. DOIT être appelé dans une transaction Prisma.
 *
 * @example generateDocumentNumber(tx, userId, 'F', 2026) → "MCB-F-2026-000001"
 */
export async function generateDocumentNumber(
  tx: Prisma.TransactionClient,
  userId: string,
  prefix: string,
  year: number
): Promise<string> {
  const MAX_ATTEMPTS = 1000;

  // Étape 1 : récupérer ou créer la séquence
  const rows = await tx.$queryRaw<Array<{ id: string; lastNumber: number }>>`
    SELECT id, "lastNumber" FROM "DocumentSequence"
    WHERE "userId" = ${userId} AND prefix = ${prefix} AND year = ${year}
    FOR UPDATE
  `;

  let sequenceId: string;
  let currentLast: number;

  if (rows.length === 0) {
    // Cas A : pas de séquence → on la crée à 0, on incrémentera
    const created = await tx.documentSequence.create({
      data: { userId, prefix, year, lastNumber: 0 },
    });
    sequenceId = created.id;
    currentLast = 0;
  } else {
    sequenceId = rows[0]!.id;
    currentLast = rows[0]!.lastNumber;
  }

  // Étape 2 : boucle collision-safe
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const nextNumber = currentLast + attempt;
    const padded = nextNumber.toString().padStart(DOCUMENT_NUMBER_PADDING, '0');
    const candidate = `${DOCUMENT_NUMBER_PREFIX}-${prefix}-${year}-${padded}`;

    const exists = await tx.document.findUnique({
      where: { number: candidate },
      select: { id: true },
    });

    if (!exists) {
      // Libre → on commit la séquence à cette valeur
      await tx.documentSequence.update({
        where: { id: sequenceId },
        data: { lastNumber: nextNumber },
      });
      return candidate;
    }
  }

  throw new Error(
    `Impossible de générer un numéro de document unique après ${MAX_ATTEMPTS} tentatives (prefix=${prefix}, year=${year})`
  );
}
