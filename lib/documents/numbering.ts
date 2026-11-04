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
  if (rows.length === 0) {
    const created = await tx.documentSequence.create({
      data: { userId, docType, year, lastNumber: 1 },
    });
    lastNumber = created.lastNumber;
  } else {
    const updated = await tx.documentSequence.update({
      where: { id: rows[0]!.id },
      data: { lastNumber: { increment: 1 } },
    });
    lastNumber = updated.lastNumber;
  }

  const padded = lastNumber.toString().padStart(DOCUMENT_NUMBER_PADDING, '0');
  return `${DOCUMENT_NUMBER_PREFIX}-${year}-${padded}`;
}

