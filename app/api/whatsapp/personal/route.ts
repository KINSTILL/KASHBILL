import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/server';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { getPersonalStatus, startPersonalConnection } from '@/lib/whatsapp/personal';

const bodySchema = z.object({ phone: z.string().min(6).max(30) });

/** État du numéro WhatsApp personnel. */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const s = await getPersonalStatus(user.id);
      return jsonOk(s);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Enregistre le numéro et renvoie le QR code à scanner. Réservé à l'add-on actif. */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const s = await getPersonalStatus(user.id);
      if (!s.hasAddOn) {
        return jsonError('FORBIDDEN', "Activez l'extension « Mon numéro WhatsApp » pour connecter votre numéro.", 403);
      }
      const data = bodySchema.parse(await req2.json());
      const result = await startPersonalConnection(user.id, data.phone);
      if (!result.ok) {
        if (result.reason === 'NOT_CONFIGURED') {
          return jsonError('INTERNAL', "Le service WhatsApp n'est pas encore configuré. Contactez le support.", 503);
        }
        if (result.reason === 'INVALID_NUMBER') {
          return jsonError('VALIDATION_ERROR', 'Numéro WhatsApp invalide.', 400);
        }
        return jsonError('INTERNAL', "Impossible de générer le code de connexion. Réessayez.", 502);
      }
      return jsonOk({ qrBase64: result.qrBase64, status: result.status });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
