'use client';

import type { PdfDocument, PdfFormat, PdfRenderOptions } from './types';

/**
 * Génère le PDF côté serveur (/api/documents/pdf) pour éviter les incompatibilités
 * Webpack / React 19 côté navigateur, avec fallback local si hors-ligne ou en test.
 */
export async function renderPdfToBlob(
  doc: PdfDocument,
  format: PdfFormat,
  options: PdfRenderOptions
): Promise<Blob> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/documents/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({ doc, format, options }),
      });
      if (res.ok) {
        const serverBlob = await res.blob();
        if (serverBlob.size > 0) {
          return new Blob([serverBlob], { type: 'application/pdf' });
        }
      }
    } catch {
      // Hors-ligne : on bascule sur le rendu client local ci-dessous
    }
  }

  const { pdf, Font } = await import('@react-pdf/renderer');
  Font.registerHyphenationCallback((word) => [word]);

  const normalizedDoc: PdfDocument = {
    ...doc,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
  };

  let element;
  if (format === 'ticket') {
    const { TicketDocument } = await import('./templates/TicketTemplate');
    element = TicketDocument({ doc: normalizedDoc, options });
  } else {
    const { A4Document } = await import('./templates/A4Template');
    element = A4Document({ doc: normalizedDoc, options });
  }

  let timerId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error('PDF render timeout (20s)')), 20000);
  });
  try {
    return await Promise.race([pdf(element as Parameters<typeof pdf>[0]).toBlob(), timeout]);
  } catch (err) {
    console.error('[pdf] échec du rendu', err);
    throw err;
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
