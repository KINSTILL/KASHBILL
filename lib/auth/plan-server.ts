import { prisma } from '@/lib/db';
import type { User } from '@prisma/client';

/**
 * Reset les compteurs mensuels si on a changé de mois.
 * Appelé côté serveur avant toute lecture de compteur mensuel.
 */
export async function maybeResetMonthlyCounters(
  user: Pick<User, 'id' | 'monthlyCountersResetAt' | 'duplicationsThisMonth' | 'renumerationsThisMonth'>
): Promise<void> {
  const now = new Date();
  const last = user.monthlyCountersResetAt;
  if (last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth()) {
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      duplicationsThisMonth: 0,
      renumerationsThisMonth: 0,
      monthlyCountersResetAt: now,
    },
  });
}
