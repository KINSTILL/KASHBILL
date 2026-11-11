'use client';

import type { PdfDocument, PdfFormat, PdfRenderOptions } from './types';

/**
 * Génère le PDF côté client. Charge @react-pdf/renderer à la demande.
 */
export async function renderPdfToBlob(
  doc: PdfDocument,
  format: PdfFormat,
  options: PdfRenderOptions
): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer');

  let element;
  if (format === 'ticket') {
    const { TicketDocument } = await import('./templates/TicketTemplate');
    element = TicketDocument({ doc, options });
  } else {
    const { A4Document } = await import('./templates/A4Template');
    element = A4Document({ doc, options });
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

