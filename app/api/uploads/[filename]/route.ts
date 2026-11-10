import type { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const { filename } = await params;

      // Vérifie que le fichier appartient à l'utilisateur
      if (!filename.startsWith(`${user.id}-`)) {
        return jsonError('FORBIDDEN', 'Accès refusé', 403);
      }

      // Protection contre directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
        return jsonError('FORBIDDEN', 'Nom de fichier invalide', 403);
      }

      try {
        const { readImageFile } = await import('@/lib/uploads/image');
        const buffer = await readImageFile(filename);

        // Détection MIME par magic bytes (plus fiable que l'extension)
        const isPng =
          buffer.length >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47;
        const contentType = isPng ? 'image/png' : 'image/jpeg';

        return new Response(new Uint8Array(buffer), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'private, max-age=3600',
          },
        });
      } catch {
        return jsonError('NOT_FOUND', 'Fichier introuvable', 404);
      }
    });
  } catch {
    return jsonError('INTERNAL', 'Erreur interne', 500);
  }
}
