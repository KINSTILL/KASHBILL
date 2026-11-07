import type { Prisma } from '@prisma/client';

const PREFIX = 'MCB-SUB';
const PADDING = 6;

export async function generateSubscriptionInvoiceNumber(
  tx: Prisma.TransactionClient,
  year: number
): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ id: string; lastNumber: number }>>`
    SELECT id, "lastNumber" FROM "PlatformInvoiceSequence"
    WHERE year = ${year}
    FOR UPDATE
  `;
  let nextNumber: number;
  if (rows.length === 0) {
    const created = await tx.platformInvoiceSequence.create({
      data: { year, lastNumber: 1 },
    });
    nextNumber = created.lastNumber;
  } else {
    const updated = await tx.platformInvoiceSequence.update({
      where: { id: rows[0]!.id },
      data: { lastNumber: { increment: 1 } },
    });
    nextNumber = updated.lastNumber;
  }
  return `${PREFIX}-${year}-${nextNumber.toString().padStart(PADDING, '0')}`;
}

