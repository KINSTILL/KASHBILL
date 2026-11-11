import { loadPdfDocument } from '@/lib/documents/load-pdf-document';
import type { PdfFormat, PdfRenderOptions } from '@/lib/pdf/types';

/** Format par défaut : ticket pour TICKET et RECU, A4 sinon (même règle que la page document). */
export function defaultFormatFor(type: string): PdfFormat {
  return type === 'TICKET' || type === 'RECU' ? 'ticket' : 'a4';
}

/**
 * Génère le PDF d'un document côté serveur, à partir des données enregistrées.
 * Les envois (email, WhatsApp, lien) et le téléchargement passent par ici : le navigateur
 * ne fournit jamais le PDF, et les règles de droits (logo, signature, cachet) sont appliquées.
 * Retourne null si le document n'appartient pas à l'utilisateur.
 */
export async function renderDocumentPdf(
  documentId: string,
  userId: string,
  format?: PdfFormat
): Promise<{ buffer: Buffer; number: string; format: PdfFormat } | null> {
  const loaded = await loadPdfDocument(documentId, userId);
  if (!loaded) return null;
  const { doc, pdfDoc } = loaded;

  const chosen: PdfFormat = format ?? defaultFormatFor(doc.type);
  const options: PdfRenderOptions = {
    format: chosen,
    showLogo: true,
    showSignature: true,
    showStamp: true,
    showCgv: true,
    showWatermark: pdfDoc.watermarked,
    whiteLabel: pdfDoc.whiteLabel ?? false,
  };

  const { pdf, Font } = await import('@react-pdf/renderer');
  Font.registerHyphenationCallback((word) => [word]);

  let element;
  if (chosen === 'ticket') {
    const { TicketDocument } = await import('@/lib/pdf/templates/TicketTemplate');
    element = TicketDocument({ doc: pdfDoc, options });
  } else {
    const { A4Document } = await import('@/lib/pdf/templates/A4Template');
    element = A4Document({ doc: pdfDoc, options });
  }

  const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();
  return { buffer: Buffer.from(await blob.arrayBuffer()), number: doc.number, format: chosen };
}
