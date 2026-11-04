import { prisma } from '@/lib/db';
import { REFERRAL_REWARD_DAYS, REFERRAL_MAX_ACCUMULATED_DAYS } from '@/lib/constants';

/**
 * Active le parrainage du user (s'il est filleul) si les conditions sont remplies.
 * Appelé après le 1er document envoyé via WhatsApp.
 */
export async function tryActivateReferral(filleulId: string): Promise<void> {
  const referral = await prisma.referral.findUnique({ where: { filleulId } });
  if (!referral || referral.status !== 'PENDING') return;

  const now = new Date();
  const windowEnd = new Date(referral.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (now > windowEnd) {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: 'REJECTED' },
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.referral.update({
      where: { id: referral.id },
      data: { status: 'REWARDED', parrainRewardedAt: now, triggeredAt: now },
    });

    const parrain = await tx.user.findUnique({ where: { id: referral.parrainId } });
    if (!parrain) return;

    const currentPro = parrain.proUntil && parrain.proUntil > now ? parrain.proUntil : now;
    const newPro = new Date(currentPro.getTime() + REFERRAL_REWARD_DAYS * 24 * 60 * 60 * 1000);
    const maxPro = new Date(now.getTime() + REFERRAL_MAX_ACCUMULATED_DAYS * 24 * 60 * 60 * 1000);

    if (newPro > maxPro) {
      const pending = Math.ceil((newPro.getTime() - maxPro.getTime()) / (24 * 60 * 60 * 1000));
      await tx.user.update({
        where: { id: parrain.id },
        data: { proUntil: maxPro, pendingProDays: parrain.pendingProDays + pending },
      });
    } else {
      await tx.user.update({
        where: { id: parrain.id },
        data: { proUntil: newPro },
      });
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
}

