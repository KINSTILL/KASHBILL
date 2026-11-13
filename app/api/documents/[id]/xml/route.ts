import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';
import { loadPdfDocument } from '@/lib/documents/load-pdf-document';
import { buildDocumentXml } from '@/lib/einvoice/ubl';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const { id } = await context.params;
      const loaded = await loadPdfDocument(id, user.id);
      if (!loaded) return jsonError('NOT_FOUND', 'Document introuvable', 404);

      // Toujours régénéré depuis les données actuelles (le document peut avoir été modifié)
      const xml = buildDocumentXml(loaded.pdfDoc);
      await prisma.document
        .update({ where: { id }, data: { xmlPayload: xml, xmlGeneratedAt: new Date() } })
        .catch(() => {});

      const safe = loaded.pdfDoc.number.replace(/[^a-zA-Z0-9_-]/g, '_');
      return new Response(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safe}.xml"`,
          'Cache-Control': 'private, no-store',
        },
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
