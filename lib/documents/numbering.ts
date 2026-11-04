import type { DocType, Prisma } from '@prisma/client';
import {
  DOCUMENT_NUMBER_PADDING,
  DOCUMENT_NUMBER_PREFIX,
} from '@/lib/constants';

/**
 * Génère un numéro de document séquentiel par utilisateur / type / année.
 * DOIT être appelé dans une transaction Prisma.
 */
export async function generateDocumentNumber(
  tx: Prisma.TransactionClient,
  userId: string,
  docType: DocType,
  year: number
): Promise<string> {
  // SELECT ... FOR UPDATE pour éviter les doublons concurrents
  const rows = await tx.$queryRaw<Array<{ id: string; lastNumber: number }>>`
    SELECT id, "lastNumber" FROM "DocumentSequence"
    WHERE "userId" = ${userId} AND "docType" = ${docType}::"DocType" AND year = ${year}
    FOR UPDATE
  `;

  let lastNumber: number;
  let seqId: string;
  if (rows.length === 0) {
    const created = await tx.documentSequence.create({
      data: { userId, docType, year, lastNumber: 1 },
    });
    lastNumber = created.lastNumber;
    seqId = created.id;
  } else {
    const updated = await tx.documentSequence.update({
      where: { id: rows[0]!.id },
      data: { lastNumber: { increment: 1 } },
    });
    lastNumber = updated.lastNumber;
    seqId = updated.id;
  }

  let padded = lastNumber.toString().padStart(DOCUMENT_NUMBER_PADDING, '0');
  let candidate = `${DOCUMENT_NUMBER_PREFIX}-${year}-${padded}`;

  // Vérifier qu'aucun document n'a déjà ce numéro (garantie d'unicité globale)
  let existing = await tx.document.findUnique({ where: { number: candidate } });
  while (existing) {
    lastNumber++;
    await tx.documentSequence.update({
      where: { id: seqId },
      data: { lastNumber },
    });
    padded = lastNumber.toString().padStart(DOCUMENT_NUMBER_PADDING, '0');
    candidate = `${DOCUMENT_NUMBER_PREFIX}-${year}-${padded}`;
    existing = await tx.document.findUnique({ where: { number: candidate } });
  }

  return candidate;
}
