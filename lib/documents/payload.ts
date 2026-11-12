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
 * - TVA = base HT × taux, arrondie au rang de précision choisi (0, 1 ou 2 décimales).
 * - Acompte = pourcentage du TTC (base HT + TVA).
 * - Net à payer = TTC − acompte.
 *
 * `decimals` = 0 par défaut (arrondi au franc, conformité XAF) ; 1 ou 2 pour préserver
 * des décimales. L'arrondi est appliqué de façon cohérente côté serveur et formulaire.
 */
export function roundTo(amount: number, decimals: number): number {
  const digits = decimals === 1 || decimals === 2 ? decimals : 0;
  const factor = 10 ** digits;
  return Math.round(amount * factor) / factor;
}

export function computeTotals(input: {
  subtotal: number;
  deliveryFee: number | null;
  vatRate: number | null;
  depositPercentage: number | null;
  decimals?: number;
}): { htBase: number; vatAmount: number | null; ttc: number; depositAmount: number | null; total: number } {
  const decimals = input.decimals ?? 0;
  const htBase = roundTo(input.subtotal + (input.deliveryFee ?? 0), decimals);
  const vatAmount = input.vatRate !== null ? roundTo(htBase * (input.vatRate / 100), decimals) : null;
  const ttc = roundTo(htBase + (vatAmount ?? 0), decimals);
  const depositAmount =
    input.depositPercentage !== null ? roundTo(ttc * (input.depositPercentage / 100), decimals) : null;
  const total = roundTo(ttc - (depositAmount ?? 0), decimals);
  return { htBase, vatAmount, ttc, depositAmount, total };
}

/**
 * Calcule côté serveur. Ne jamais faire confiance au client pour les totaux.
 * `decimals` : précision d'arrondi (0 par défaut).
 */
export function computePayload(input: DocumentPayloadInput, decimals = 0): ComputedPayload {
  const lines = input.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    total: roundTo(l.quantity * l.unitPrice, decimals),
    photoUrl: l.photoUrl ?? null,
  }));

  const subtotal = roundTo(
    lines.reduce((acc, l) => acc + l.total, 0),
    decimals
  );
  const deliveryFee = input.deliveryFee ?? null;
  const { vatAmount, depositAmount, total } = computeTotals({
    subtotal,
    deliveryFee,
    vatRate: input.vatRate,
    depositPercentage: input.depositPercentage,
    decimals,
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

