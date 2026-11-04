import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { recoveryUseSchema } from '@/lib/validators/auth';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { checkCsrf, getClientIp, getUserAgent, writeAudit } from '@/lib/api/server';
import { hashPin } from '@/lib/auth/pin';
import { verifyAndConsumeRecoveryCode } from '@/lib/auth/recovery';
import { registerDevice, revokeAllOtherDevices } from '@/lib/auth/device';
import { setSessionCookie } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_RECOVERY_PER_PHONE } from '@/lib/constants';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const csrf = checkCsrf(req);
    if (csrf) return csrf;

    const body = await req.json();
    const data = recoveryUseSchema.parse(body);

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const rl = rateLimit(
      `recovery:${data.phone}`,
      RATE_LIMIT_RECOVERY_PER_PHONE.limit,
      RATE_LIMIT_RECOVERY_PER_PHONE.windowMs
    );
    if (!rl.allowed) {
      return jsonError('RATE_LIMITED', 'Trop de tentatives, réessayez plus tard', 429);
    }

    const user = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user) {
      return jsonError('RECOVERY_CODE_INVALID', 'Code invalide', 400);
    }
    if (user.bannedAt) {
      return jsonError('FORBIDDEN', 'Compte suspendu', 403);
    }

    const ok = await verifyAndConsumeRecoveryCode(user.id, data.recoveryCode);
    if (!ok) {
      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'recovery_failed',
        ip,
        userAgent,
      });
      return jsonError('RECOVERY_CODE_INVALID', 'Code invalide ou déjà utilisé', 400);
    }

    const newHash = await hashPin(data.newPin);
    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash: newHash },
    });

    const deviceResult = await registerDevice(user, data.deviceId, userAgent, ip);
    if (!deviceResult.ok) {
      await prisma.device.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await registerDevice(user, data.deviceId, userAgent, ip);
    }

    // Révoque tous les autres appareils par sécurité
    await revokeAllOtherDevices(user.id, data.deviceId);

    const response = jsonOk({
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        locale: user.locale,
        proUntil: user.proUntil,
      },
    });

    await setSessionCookie(user.id, data.deviceId, user.role, response);

    await writeAudit({
      actorId: user.id,
      targetId: user.id,
      action: 'recovery_used',
      ip,
      userAgent,
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}

