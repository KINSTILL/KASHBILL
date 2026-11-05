import { z } from 'zod';

const lineSchema = z.object({
  description: z.string().min(1).max(200),
  quantity: z.number().positive().max(10000),
  unitPrice: z.number().nonnegative().max(1_000_000_000),
  photoUrl: z.string().url().optional().nullable(),
});

export const documentPayloadSchema = z.object({
  lines: z.array(lineSchema).min(1).max(200),
  vatRate: z.number().min(0).max(30).nullable().default(null),
  depositPercentage: z.number().min(0).max(100).nullable().default(null),
  deliveryFee: z.number().nonnegative().nullable().default(null),
  notes: z.string().max(1000).nullable().default(null),
  validityDays: z.number().int().positive().max(365).nullable().default(null),
});

export type DocumentPayloadInput = z.infer<typeof documentPayloadSchema>;

export type ComputedPayload = {
  lines: Array<{ description: string; quantity: number; unitPrice: number; total: number; photoUrl?: string | null }>;
  subtotal: number;
  vatRate: number | null;
  vatAmount: number | null;
  depositAmount: number | null;
  deliveryFee: number | null;
  notes: string | null;
  validityDays: number | null;
  total: number;
};

/**
 * Calcule côté serveur. Ne jamais faire confiance au client pour les totaux.
 */
export function computePayload(input: DocumentPayloadInput): ComputedPayload {
  const lines = input.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    total: Math.round(l.quantity * l.unitPrice),
    photoUrl: l.photoUrl ?? null,
  }));

  const subtotal = lines.reduce((acc, l) => acc + l.total, 0);
  const vatAmount = input.vatRate !== null ? Math.round(subtotal * (input.vatRate / 100)) : null;
  const depositAmount =
    input.depositPercentage !== null
      ? Math.round((subtotal + (vatAmount ?? 0)) * (input.depositPercentage / 100))
      : null;
  const deliveryFee = input.deliveryFee ?? null;
  const total =
    subtotal +
    (vatAmount ?? 0) +
    (deliveryFee ?? 0) -
    (depositAmount ?? 0);

  return {
    lines,
    subtotal,
    vatRate: input.vatRate,
    vatAmount,
    depositAmount,
    deliveryFee,
    notes: input.notes,
    validityDays: input.validityDays ?? null,
    total,
  };
}

