import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/server';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { getActiveAddOns } from '@/lib/addons/queries';

/** Add-ons actuellement actifs (expirés exclus). */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const addOns = await getActiveAddOns(user.id);
      return jsonOk({
        addOns: addOns.map((a) => ({ type: a.type, endsAt: a.endsAt })),
        personalWhatsApp: addOns.some((a) => a.type === 'CUSTOM_WHATSAPP'),
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
