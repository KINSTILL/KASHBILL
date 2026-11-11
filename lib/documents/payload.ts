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
  dueDate: z.string().datetime().nullable().default(null),
  referenceNumber: z.string().max(50).nullable().default(null),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHECK']).nullable().default(null),
  paymentReference: z.string().max(100).nullable().default(null),
  paymentOperator: z.string().max(50).nullable().default(null),
  paymentOperatorFreeText: z.string().max(100).nullable().default(null),
  equivalentCurrency: z.string().length(3).nullable().default(null),
  equivalentAmount: z.number().nonnegative().nullable().default(null),
  exchangeRate: z.number().positive().nullable().default(null),
  exchangeRateNote: z.string().max(100).nullable().default(null),
  deliveryDate: z.string().datetime().nullable().default(null),
  deliveryAddress: z.string().max(300).nullable().default(null),
});

export type DocumentPayloadInput = z.infer<typeof documentPayloadSchema>;

export type ComputedPayload = {
  lines: Array<{ description: string; quantity: number; unitPrice: number; total: number; photoUrl?: string | null }>;
  subtotal: number;
  vatRate: number | null;
  vatAmount: number | null;
  depositAmount: number | null;
  depositPercentage: number | null;
  deliveryFee: number | null;
  notes: string | null;
  validityDays: number | null;
  total: number;
  dueDate: string | null;
  referenceNumber: string | null;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHECK' | null;
  paymentReference: string | null;
  paymentOperator: string | null;
  paymentOperatorFreeText: string | null;
  equivalentCurrency: string | null;
  equivalentAmount: number | null;
  exchangeRate: number | null;
  exchangeRateNote: string | null;
  deliveryDate: string | null;
  deliveryAddress: string | null;
};

/**
 * Formule unique des totaux, partagée par le serveur et le formulaire (aperçu en direct).
 *
 * - Base HT de la TVA = sous-total des articles + frais de livraison (le transport est
 *   une prestation accessoire soumise à la TVA).
 * - TVA = base HT × taux, arrondie au franc.
 * - Acompte = pourcentage du TTC (base HT + TVA).
 * - Net à payer = TTC − acompte.
 */
export function computeTotals(input: {
  subtotal: number;
  deliveryFee: number | null;
  vatRate: number | null;
  depositPercentage: number | null;
}): { htBase: number; vatAmount: number | null; ttc: number; depositAmount: number | null; total: number } {
  const htBase = input.subtotal + (input.deliveryFee ?? 0);
  const vatAmount = input.vatRate !== null ? Math.round(htBase * (input.vatRate / 100)) : null;
  const ttc = htBase + (vatAmount ?? 0);
  const depositAmount =
    input.depositPercentage !== null ? Math.round(ttc * (input.depositPercentage / 100)) : null;
  const total = ttc - (depositAmount ?? 0);
  return { htBase, vatAmount, ttc, depositAmount, total };
}

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
  const deliveryFee = input.deliveryFee ?? null;
  const { vatAmount, depositAmount, total } = computeTotals({
    subtotal,
    deliveryFee,
    vatRate: input.vatRate,
    depositPercentage: input.depositPercentage,
  });

  return {
    lines,
    subtotal,
    vatRate: input.vatRate,
    vatAmount,
    depositAmount,
    depositPercentage: input.depositPercentage,
    deliveryFee,
    notes: input.notes,
    validityDays: input.validityDays ?? null,
    total,
    dueDate: input.dueDate,
    referenceNumber: input.referenceNumber,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference,
    paymentOperator: input.paymentOperator,
    paymentOperatorFreeText: input.paymentOperatorFreeText,
    equivalentCurrency: input.equivalentCurrency,
    equivalentAmount: input.equivalentAmount,
    exchangeRate: input.exchangeRate,
    exchangeRateNote: input.exchangeRateNote,
    deliveryDate: input.deliveryDate,
    deliveryAddress: input.deliveryAddress,
  };
}

