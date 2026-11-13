import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyDocumentShareToken } from '@/lib/share/pdf-token';
import { renderDocumentPdf } from '@/lib/pdf/render-document';

/**
 * Téléchargement public du PDF via le lien de partage.
 *
 * Le PDF est RÉGÉNÉRÉ à la volée depuis la base : aucun fichier n'est stocké sur le disque,
 * donc aucun lien mort après un redéploiement ou sur une autre instance.
 * Le jeton HMAC garantit l'accès ; le document doit exister.
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

    // Régénéré depuis les données actuelles du document (propriétaire = userId du document).
    const rendered = await renderDocumentPdf(doc.id, doc.userId);
    if (!rendered) {
      console.error('[PUBLIC PDF] rendu impossible', { documentId: doc.id });
      return new Response('Document PDF indisponible', { status: 404 });
    }

    const safeFilename = `${doc.number.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    return new Response(new Uint8Array(rendered.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    console.error('[PUBLIC PDF] erreur', err);
    return new Response('Document PDF indisponible', { status: 500 });
  }
}
