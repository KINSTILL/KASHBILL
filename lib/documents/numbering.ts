import type { Prisma } from '@prisma/client';
import { DOCUMENT_NUMBER_PREFIX, DOCUMENT_NUMBER_PADDING } from '@/lib/constants';

/**
 * Génère un numéro de document séquentiel par (userId, prefix, year).
 * DOIT être appelé dans une transaction Prisma.
 *
 * @example generateDocumentNumber(tx, userId, 'F', 2026) → "MCB-F-2026-000001"
 */
export async function generateDocumentNumber(
  tx: Prisma.TransactionClient,
  userId: string,
  prefix: string,
  year: number
): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ id: string; lastNumber: number }>>`
    SELECT id, "lastNumber" FROM "DocumentSequence"
    WHERE "userId" = ${userId} AND prefix = ${prefix} AND year = ${year}
    FOR UPDATE
  `;

  let lastNumber: number;
  if (rows.length === 0) {
    const created = await tx.documentSequence.create({
      data: { userId, prefix, year, lastNumber: 1 },
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
  return `${DOCUMENT_NUMBER_PREFIX}-${prefix}-${year}-${padded}`;
}
