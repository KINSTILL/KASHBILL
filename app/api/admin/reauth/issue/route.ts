import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, checkCsrf } from '@/lib/api/server';
import { verifyPin } from '@/lib/auth/pin';
import { issueReauthToken } from '@/lib/admin/reauth';
import { isAdmin } from '@/lib/admin/roles';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({ pin: z.string().regex(/^\d{6}$/) });

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const csrf = checkCsrf(req);
    if (csrf) return csrf;

    return await requireAuth(req, async (req2, { user }) => {
      if (!isAdmin(user)) {
        return jsonError('FORBIDDEN', 'Accès administrateur requis', 403);
      }

      const rl = rateLimit(`reauth:${user.id}`, 5, 15 * 60 * 1000);
      if (!rl.allowed) {
        return jsonError('RATE_LIMITED', 'Trop de tentatives', 429);
      }

      const body = await req2.json();
      const { pin } = schema.parse(body);

      const ok = await verifyPin(user.pinHash, pin);
      if (!ok) {
        return jsonError('REAUTH_INVALID', 'PIN incorrect', 401);
      }

      const token = await issueReauthToken(user.id);
      return jsonOk({ reauthToken: token, expiresInSeconds: 120 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

