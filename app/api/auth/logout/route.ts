import type { NextRequest } from 'next/server';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { checkCsrf, getClientIp, getUserAgent, writeAudit } from '@/lib/api/server';
import { getCurrentUser, clearSessionCookie } from '@/lib/auth/session';
import { revokeDevice } from '@/lib/auth/device';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const csrf = checkCsrf(req);
    if (csrf) return csrf;

    const current = await getCurrentUser(req);
    if (current) {
      await revokeDevice(current.user.id, current.deviceId);
      await writeAudit({
        actorId: current.user.id,
        targetId: current.user.id,
        action: 'logout',
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });
    }

    const response = jsonOk({ ok: true });
    await clearSessionCookie(response);
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}

