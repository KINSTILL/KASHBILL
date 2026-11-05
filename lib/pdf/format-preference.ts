'use client';

import type { DocType } from '@prisma/client';
import type { PdfFormat } from './types';

const STORAGE_KEY = 'mycashbill:pdf-format-preference:v1';

export function getDefaultFormat(docType: DocType): PdfFormat {
  return docType === 'TICKET' || docType === 'RECU' ? 'ticket' : 'a4';
}

export function getPreferredFormat(docType: DocType): PdfFormat {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'ticket' || raw === 'a4') return raw;
  } catch {}
  return getDefaultFormat(docType);
}

export function savePreferredFormat(format: PdfFormat): void {
  try {
    localStorage.setItem(STORAGE_KEY, format);
  } catch {}
}

