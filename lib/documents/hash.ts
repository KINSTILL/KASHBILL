import { createHash } from 'node:crypto';
import { canonicalStringify } from '@/lib/utils';

export type DocumentHashInput = {
  userId: string;
  docType: string;
  number: string;
  locale: string;
  payload: unknown;
  createdAt: string; // ISO
};

export function computeContentHash(input: DocumentHashInput): string {
  const canonical = canonicalStringify({
    userId: input.userId,
    docType: input.docType,
    number: input.number,
    locale: input.locale,
    payload: input.payload,
    createdAt: input.createdAt,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

