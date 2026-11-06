import { z } from 'zod';

export const legalFieldsSchema = z.object({
  country: z.string().length(2, 'Code pays ISO 2 lettres').optional(),
  legalName: z.string().max(200).optional(),
  legalForm: z.string().max(50).optional(),
  taxId: z.string().max(50).optional(),
  rccm: z.string().max(50).optional(),
  legalAddress: z.string().max(500).optional(),
  headerText: z.string().max(200).optional(),
  footerText: z.string().max(500).optional(),
  cgvText: z.string().max(2000).optional(),
});

export type LegalFieldsInput = z.infer<typeof legalFieldsSchema>;

