import type { NextRequest } from 'next/server';
import { buildSampleInvoice } from '@/lib/landing/sample-invoice';

export const runtime = 'nodejs';
// Rendu à chaque mise en cache : le PDF reflète toujours le template actuel du SaaS.
export const dynamic = 'force-dynamic';

/**
 * PDF d'exemple public (page vitrine). Rendu avec le même template A4 que le SaaS.
 * - par défaut : téléchargement (Content-Disposition: attachment)
 * - ?inline=1 : affichage dans la modale de la vitrine
 */
export async function GET(req: NextRequest): Promise<Response> {
  const inline = req.nextUrl.searchParams.get('inline') === '1';

  const { pdf, Font } = await import('@react-pdf/renderer');
  Font.registerHyphenationCallback((word) => [word]);
  const { A4Document } = await import('@/lib/pdf/templates/A4Template');

  const { doc, options } = buildSampleInvoice();
  const element = A4Document({ doc, options });
  const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();
  const body = new Uint8Array(await blob.arrayBuffer());

  const disposition = inline ? 'inline' : 'attachment';
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="facture-exemple-mycashbill.pdf"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
