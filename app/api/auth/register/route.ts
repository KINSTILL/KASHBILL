import type { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validators/auth';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { checkCsrf, getClientIp, getUserAgent, writeAudit } from '@/lib/api/server';
import { hashPin } from '@/lib/auth/pin';
import { generateUniqueReferralCode, findUserByReferralCode } from '@/lib/auth/referral';
import { generateRecoveryCodes } from '@/lib/auth/recovery';
import { registerDevice } from '@/lib/auth/device';
import { setSessionCookie } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
import {
  RATE_LIMIT_REGISTER_PER_IP,
  RATE_LIMIT_REGISTER_PER_PHONE,
  TRIAL_DURATION_DAYS,
} from '@/lib/constants';

function normalizeRecovery(c: string): string {
  return c.replace(/-/g, '').toUpperCase();
}

function hashRecovery(c: string): string {
  return createHash('sha256').update(normalizeRecovery(c)).digest('hex');
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const csrf = checkCsrf(req);
    if (csrf) return csrf;

    const body = await req.json();
    const data = registerSchema.parse(body);

    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    // Rate limit
    const phoneRl = rateLimit(
      `reg:phone:${data.phone}`,
      RATE_LIMIT_REGISTER_PER_PHONE.limit,
      RATE_LIMIT_REGISTER_PER_PHONE.windowMs
    );
    if (!phoneRl.allowed) {
      return jsonError('RATE_LIMITED', 'Trop de tentatives, réessayez plus tard', 429);
    }
    if (ip) {
      const ipRl = rateLimit(
        `reg:ip:${ip}`,
        RATE_LIMIT_REGISTER_PER_IP.limit,
        RATE_LIMIT_REGISTER_PER_IP.windowMs
      );
      if (!ipRl.allowed) {
        return jsonError('RATE_LIMITED', 'Trop de tentatives, réessayez plus tard', 429);
      }
    }

    // Phone unique
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      return jsonError('CONFLICT', 'Ce numéro est déjà utilisé', 409);
    }

    // Referral (silencieux si invalide)
    let referrerId: string | null = null;
    if (data.referredByCode) {
      const referrer = await findUserByReferralCode(data.referredByCode);
      if (referrer) referrerId = referrer.id;
    }

    const pinHash = await hashPin(data.pin);
    const referralCode = await generateUniqueReferralCode();
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    const recoveryCodes = generateRecoveryCodes();

    // Transaction : user + recovery codes + subscription TRIAL + referral
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: data.phone,
          pinHash,
          name: data.name ?? null,
          businessName: data.businessName ?? null,
          city: data.city ?? null,
          mode: data.mode ?? 'ECOMMERCE',
          country: data.country ?? 'CM',
          locale: data.locale,
          referralCode,
          proUntil: trialEnd,
        },
      });

      await tx.recoveryCode.createMany({
        data: recoveryCodes.map((c) => ({
          userId: user.id,
          codeHash: hashRecovery(c),
        })),
      });

      await tx.subscription.create({
        data: {
          userId: user.id,
          source: 'TRIAL',
          startsAt: now,
          endsAt: trialEnd,
        },
      });

      if (referrerId) {
        // Récupérer l'IP + device du parrain (dernier device actif)
        const parrainDevice = await tx.device.findFirst({
          where: { userId: referrerId, revokedAt: null },
          orderBy: { lastSeenAt: 'desc' },
          select: { deviceId: true, lastIp: true },
        });

        await tx.referral.create({
          data: {
            parrainId: referrerId,
            filleulId: user.id,
            status: 'PENDING',
            parrainIp: parrainDevice?.lastIp ?? ip,
            parrainDeviceId: parrainDevice?.deviceId ?? null,
            filleulRewardedAt: now,
          },
        });
      }

      return user;
    });

    // Enregistre le device (hors transaction : dépend de la limite)
    const deviceResult = await registerDevice(created, data.deviceId, userAgent, ip);
    if (!deviceResult.ok) {
      // Cas très rare sur un nouveau compte (limite 1 device en gratuit)
      // On force : révoque tous puis réenregistre
      await prisma.device.updateMany({
        where: { userId: created.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await registerDevice(created, data.deviceId, userAgent, ip);
    }

    const response = jsonOk(
      {
        user: {
          id: created.id,
          phone: created.phone,
          name: created.name,
          businessName: created.businessName,
          city: created.city,
          locale: created.locale,
          role: created.role,
          mode: created.mode,
          proUntil: created.proUntil,
          referralCode: created.referralCode,
        },
        recoveryCodes,
      },
      201
    );

    await setSessionCookie(created.id, data.deviceId, created.role, response);

    await writeAudit({
      actorId: created.id,
      targetId: created.id,
      action: 'register',
      meta: { referredBy: referrerId, phone: data.phone },
      ip,
      userAgent,
    });

    const { getCurrentConsentVersions, recordConsent } = await import('@/lib/legal/queries');
    type LegalSlugType = Parameters<typeof recordConsent>[1];
    const versions = await getCurrentConsentVersions('FR');
    for (const [slug, version] of Object.entries(versions)) {
      await recordConsent(created.id, slug as LegalSlugType, version, ip, userAgent);
    }

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}

