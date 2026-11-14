import { z } from 'zod';

export const scanConfidenceSchema = z.enum(['haute', 'moyenne', 'basse']);
export type ScanConfidence = z.infer<typeof scanConfidenceSchema>;

export const scannedQuoteItemSchema = z.object({
  description: z.string().default(''),
  quantity: z.number().nullable(),
  unitPrice: z.number().nullable(),
  total: z.number().nullable(),
});
export type ScannedQuoteItem = z.infer<typeof scannedQuoteItemSchema>;

export const scannedQuoteSchema = z.object({
  client: z.string().nullable(),
  date: z.string().nullable(),
  items: z.array(scannedQuoteItemSchema),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number().nullable(),
});
export type ScannedQuote = z.infer<typeof scannedQuoteSchema>;

export const scanResultSchema = z.object({
  data: scannedQuoteSchema,
  confidence: z.record(z.string(), scanConfidenceSchema),
});
export type ScanResult = z.infer<typeof scanResultSchema>;
