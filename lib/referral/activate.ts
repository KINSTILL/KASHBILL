import { prisma } from '@/lib/db';
import { REFERRAL_REWARD_DAYS, REFERRAL_MAX_ACCUMULATED_DAYS } from '@/lib/constants';

export type ActivationResult =
  | { ok: true }
  | { ok: false; reason: 'NOT_FOUND' | 'NOT_PENDING' | 'EXPIRED' | 'SAME_IP' | 'SAME_DEVICE' };

export async function tryActivateReferral(
  filleulId: string,
  filleulIp: string | null,
  filleulDeviceId: string | null
): Promise<ActivationResult> {
  const referral = await prisma.referral.findUnique({ where: { filleulId } });
  if (!referral) return { ok: false, reason: 'NOT_FOUND' };
  if (referral.status !== 'PENDING') return { ok: false, reason: 'NOT_PENDING' };

  const now = new Date();

  // Anti-fraude 1 : fenêtre 7 jours
  const windowEnd = new Date(referral.createdAt.getTime() + 7 * 86_400 * 1000);
  if (now > windowEnd) {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: 'REJECTED', fraudFlags: { reason: 'EXPIRED' } },
    });
    return { ok: false, reason: 'EXPIRED' };
  }

  // Anti-fraude 2 : même IP
  if (referral.parrainIp && filleulIp && referral.parrainIp === filleulIp) {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: 'REJECTED', fraudFlags: { reason: 'SAME_IP', ip: filleulIp } },
    });
    return { ok: false, reason: 'SAME_IP' };
  }

  // Anti-fraude 3 : même device
  if (
    referral.parrainDeviceId &&
    filleulDeviceId &&
    referral.parrainDeviceId === filleulDeviceId
  ) {
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'REJECTED',
        fraudFlags: { reason: 'SAME_DEVICE', deviceId: filleulDeviceId },
      },
    });
    return { ok: false, reason: 'SAME_DEVICE' };
  }

  // Attribution (logique existante)
  await prisma.$transaction(async (tx) => {
    await tx.referral.update({
      where: { id: referral.id },
      data: { status: 'REWARDED', parrainRewardedAt: now, triggeredAt: now },
    });

    const parrain = await tx.user.findUnique({ where: { id: referral.parrainId } });
    if (!parrain) return;

    const currentPro = parrain.proUntil && parrain.proUntil > now ? parrain.proUntil : now;
    const newPro = new Date(currentPro.getTime() + REFERRAL_REWARD_DAYS * 86_400 * 1000);
    const maxPro = new Date(now.getTime() + REFERRAL_MAX_ACCUMULATED_DAYS * 86_400 * 1000);

    if (newPro > maxPro) {
      const pending = Math.ceil((newPro.getTime() - maxPro.getTime()) / 86_400_000);
      await tx.user.update({
        where: { id: parrain.id },
        data: { proUntil: maxPro, pendingProDays: parrain.pendingProDays + pending },
      });
    } else {
      await tx.user.update({ where: { id: parrain.id }, data: { proUntil: newPro } });
    }

    await tx.subscription.create({
      data: {
        userId: parrain.id,
        source: 'REFERRAL',
        startsAt: now,
        endsAt: newPro,
      },
    });
  });

  return { ok: true };
}
