import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/server';
import { jsonError, jsonOk, handleApiError } from '@/lib/api-helpers';
import { saveImage } from '@/lib/uploads/image';
import type { ImageKind } from '@/lib/validators/image';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const formData = await req.formData();
      const file = formData.get('file');
      const kindStr = formData.get('kind');

      if (!file || !(file instanceof File)) {
        return jsonError('BAD_REQUEST', 'Fichier manquant ou invalide', 400);
      }

      const validKinds: ImageKind[] = ['logo', 'signature', 'stamp'];
      const kind: ImageKind = validKinds.includes(kindStr as ImageKind)
        ? (kindStr as ImageKind)
        : 'logo';

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await saveImage(buffer, user.id, kind);
      if (!result.ok) {
        const errorMessages: Record<string, string> = {
          TOO_LARGE: 'Image trop volumineuse',
          INVALID_TYPE: 'Format non supporté (PNG ou JPEG uniquement)',
          EMPTY: 'Fichier vide',
          IO_ERROR: 'Erreur d\'écriture sur le serveur',
        };
        return jsonError('BAD_REQUEST', errorMessages[result.reason] || 'Upload invalide', 400);
      }

      return jsonOk({ url: result.url });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

