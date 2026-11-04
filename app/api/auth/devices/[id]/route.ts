import type { NextRequest } from 'next/server';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { revokeDevice } from '@/lib/auth/device';
import { clearSessionCookie } from '@/lib/auth/session';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, deviceId, ip, userAgent }) => {
      const { id } = await params;

      const revoked = await revokeDevice(user.id, id);
      if (!revoked) {
        return jsonError('DEVICE_NOT_FOUND', 'Appareil introuvable', 404);
      }

      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'device_revoked',
        meta: { revokedDeviceId: id, self: id === deviceId },
        ip,
        userAgent,
      });

      if (id === deviceId) {
        const response = jsonOk({ ok: true, loggedOut: true });
        await clearSessionCookie(response);
        return response;
      }

      return jsonOk({ ok: true, loggedOut: false });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
