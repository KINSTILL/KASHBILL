import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/server';
import { jsonError, handleApiError } from '@/lib/api-helpers';
import type { PdfDocument, PdfFormat, PdfRenderOptions } from '@/lib/pdf/types';
import { applyImageBrandingPolicy } from '@/lib/branding/policy';
import { isPro } from '@/lib/auth/plan';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const body = (await req2.json().catch(() => null)) as {
        doc?: PdfDocument;
        format?: PdfFormat;
        options?: PdfRenderOptions;
      } | null;

      if (!body?.doc || !body?.format || !body?.options) {
        return jsonError('BAD_REQUEST', 'Paramètres PDF manquants', 400);
      }

      const { doc, format, options } = body;
      const normalizedDoc: PdfDocument = {
        ...doc,
        createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
        // Logo, signature et cachet : refusés côté serveur si le compte n'est pas Pro
        company: {
          ...applyImageBrandingPolicy(doc.company, user),
          showStampOnTicket: user.showStampOnTicket && isPro(user),
        },
      };

      const { pdf, Font } = await import('@react-pdf/renderer');
      Font.registerHyphenationCallback((word) => [word]);

      let element;
      if (format === 'ticket') {
        const { TicketDocument } = await import('@/lib/pdf/templates/TicketTemplate');
        element = TicketDocument({ doc: normalizedDoc, options });
      } else {
        const { A4Document } = await import('@/lib/pdf/templates/A4Template');
        element = A4Document({ doc: normalizedDoc, options });
      }

      const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();
      const arrayBuffer = await blob.arrayBuffer();

      return new Response(new Uint8Array(arrayBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'no-store',
        },
      });
    });
  } catch (err) {
    console.error('[api/documents/pdf] erreur de génération PDF:', err);
    return handleApiError(err);
  }
}
