import { z } from 'zod';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import type { DocType } from '@prisma/client';

const lineSchema = z.object({
  description: z.string().min(1, 'La description est requise').max(200),
  quantity: z.number().positive('Quantité > 0').max(10000),
  unitPrice: z.number().nonnegative('Prix ≥ 0').max(1_000_000_000),
  photoUrl: z.string().url().optional().nullable(),
});

export const documentPayloadSchema = z.object({
  lines: z.array(lineSchema).min(1, 'Au moins une ligne est requise').max(200),
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

export type CompanyFields = {
  taxId: string | null;
  rccm: string | null;
  legalName: string | null;
  legalAddress: string | null;
};

export const createDocumentSchema = z
  .object({
    clientId: z.string().optional().nullable(),
    type: z.enum(['TICKET', 'BON_COMMANDE', 'BORDEREAU', 'DEVIS', 'PROFORMA', 'FACTURE', 'RECU']),
    locale: z.enum(['FR', 'EN']).default('FR'),
    payload: documentPayloadSchema,
  })
  .superRefine((data, ctx) => {
    const config = DOC_TYPE_CONFIG[data.type as DocType];

    // Vérifie que les champs entreprise requis sont renseignés (côté appelant)
    // L'appelant doit fournir `user` dans le contexte ; on ne peut pas le faire ici
    // sans coupler le schéma à la DB. On expose donc une fonction dédiée.
    if (config.showValidity && data.payload.validityDays === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'validityDays'],
        message: `La durée de validité est obligatoire pour un ${config.label}.`,
      });
    }

    if (config.showVat && data.payload.vatRate === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', 'vatRate'],
        message: `Le taux de TVA est obligatoire pour une ${config.label}.`,
      });
    }
  });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

/**
 * Vérifie que les champs entreprise requis pour ce type de document sont renseignés.
 * Retourne la liste des champs manquants (vide = OK).
 */
export function checkRequiredCompanyFields(
  type: DocType,
  company: CompanyFields
): Array<keyof CompanyFields> {
  const config = DOC_TYPE_CONFIG[type];
  return config.requiredCompanyFields.filter((field) => {
    const value = company[field];
    return value === null || value === undefined || value.trim() === '';
  });
}

