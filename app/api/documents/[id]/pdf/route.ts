import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/server';
import { jsonError, handleApiError } from '@/lib/api-helpers';
import { renderDocumentPdf } from '@/lib/pdf/render-document';
import type { PdfFormat } from '@/lib/pdf/types';

export const runtime = 'nodejs';

/** Téléchargement du PDF d'un document, généré par le serveur à partir des données enregistrées. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const { id } = await context.params;
      const formatParam = new URL(req2.url).searchParams.get('format');
      const format: PdfFormat | undefined =
        formatParam === 'ticket' ? 'ticket' : formatParam === 'a4' ? 'a4' : undefined;

      const rendered = await renderDocumentPdf(id, user.id, format);
      if (!rendered) return jsonError('NOT_FOUND', 'Document introuvable', 404);

      return new Response(new Uint8Array(rendered.buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${rendered.number}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
