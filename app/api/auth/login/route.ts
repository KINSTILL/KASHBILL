import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { loginSchema } from '@/lib/validators/auth';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { checkCsrf, getClientIp, getUserAgent, writeAudit } from '@/lib/api/server';
import { verifyPin } from '@/lib/auth/pin';
import { registerDevice } from '@/lib/auth/device';
import { setSessionCookie } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
import {
  RATE_LIMIT_LOGIN_PER_IP,
  RATE_LIMIT_LOGIN_PER_PHONE,
} from '@/lib/constants';

// Hash factice pour anti-timing (ne correspond à aucun PIN réel)
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const csrf = checkCsrf(req);
    if (csrf) return csrf;

    const body = await req.json();
    const data = loginSchema.parse(body);

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    const phoneRl = rateLimit(
      `login:phone:${data.phone}`,
      RATE_LIMIT_LOGIN_PER_PHONE.limit,
      RATE_LIMIT_LOGIN_PER_PHONE.windowMs
    );
    if (!phoneRl.allowed) {
      await writeAudit({
        action: 'login_rate_limited',
        meta: { phone: data.phone },
        ip,
        userAgent,
      });
      return jsonError('RATE_LIMITED', 'Trop de tentatives, réessayez plus tard', 429);
    }

    if (ip) {
      const ipRl = rateLimit(
        `login:ip:${ip}`,
        RATE_LIMIT_LOGIN_PER_IP.limit,
        RATE_LIMIT_LOGIN_PER_IP.windowMs
      );
      if (!ipRl.allowed) {
        return jsonError('RATE_LIMITED', 'Trop de tentatives, réessayez plus tard', 429);
      }
    }

    const user = await prisma.user.findUnique({ where: { phone: data.phone } });

    // Anti-timing : simuler un hash même si user absent
    if (!user) {
      await verifyPin(DUMMY_HASH, data.pin);
      await writeAudit({
        action: 'login_failed_unknown',
        meta: { phone: data.phone },
        ip,
        userAgent,
      });
      return jsonError('INVALID_CREDENTIALS', 'Numéro ou PIN incorrect', 401);
    }

    if (user.bannedAt) {
      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'login_failed_banned',
        ip,
        userAgent,
      });
      return jsonError('FORBIDDEN', 'Compte suspendu', 403);
    }

    const pinOk = await verifyPin(user.pinHash, data.pin);
    if (!pinOk) {
      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'login_failed_pin',
        ip,
        userAgent,
      });
      return jsonError('INVALID_CREDENTIALS', 'Numéro ou PIN incorrect', 401);
    }

    const deviceResult = await registerDevice(user, data.deviceId, userAgent, ip);
    if (!deviceResult.ok) {
      return jsonError(
        'DEVICE_LIMIT_REACHED',
        "Limite d'appareils atteinte. Révoquez un appareil existant pour continuer.",
        409,
        {
          activeDevices: deviceResult.activeDevices.map((d) => ({
            deviceId: d.deviceId,
            userAgent: d.userAgent,
            lastSeenAt: d.lastSeenAt,
            isCurrent: false,
          })),
        }
      );
    }

    const response = jsonOk({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        businessName: user.businessName,
        city: user.city,
        locale: user.locale,
        role: user.role,
        mode: user.mode,
        proUntil: user.proUntil,
        referralCode: user.referralCode,
      },
    });

    await setSessionCookie(user.id, data.deviceId, user.role, response);

    // Trace la dernière connexion admin
    if (user.role === 'ADMIN' || user.role === 'SUPPORT') {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastAdminLoginAt: new Date() },
      });
    }

    await writeAudit({
      actorId: user.id,
      targetId: user.id,
      action: 'login',
      ip,
      userAgent,
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
