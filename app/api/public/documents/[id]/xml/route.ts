import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyDocumentShareToken } from '@/lib/share/pdf-token';
import { loadPdfDocument } from '@/lib/documents/load-pdf-document';
import { buildDocumentXml } from '@/lib/einvoice/ubl';

/**
 * Téléchargement public du XML d'un document via le lien de partage.
 * Même jeton HMAC que le PDF. Le XML est régénéré depuis la base :
 * aucun fichier n'est stocké, donc rien à nettoyer.
 *
 * La vérification du jeton vit dans @/lib/share/pdf-token (route.ts ne tolère que les handlers).
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await context.params;
    const token = req.nextUrl.searchParams.get('t') ?? '';

    if (!verifyDocumentShareToken(id, token)) {
      return new Response('Lien invalide ou expiré', { status: 403 });
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      select: { id: true, number: true, userId: true },
    });

    if (!doc) {
      return new Response('Document introuvable', { status: 404 });
    }

    const loaded = await loadPdfDocument(doc.id, doc.userId);
    if (!loaded) {
      return new Response('Document introuvable', { status: 404 });
    }

    const xml = buildDocumentXml(loaded.pdfDoc);
    await prisma.document
      .update({ where: { id: doc.id }, data: { xmlPayload: xml, xmlGeneratedAt: new Date() } })
      .catch(() => {});

    const safeFilename = `${doc.number.replace(/[^a-zA-Z0-9_-]/g, '_')}.xml`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new Response('Document XML indisponible', { status: 404 });
  }
}
