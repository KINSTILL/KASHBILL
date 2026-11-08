import { prisma } from '@/lib/db';
import type { AddOnType, User } from '@prisma/client';

export const ADDON_PRICES = {
  EXTRA_DEVICE: 500,
  WHITE_LABEL: 3000,
} as const;

export async function hasActiveAddOn(userId: string, type: AddOnType): Promise<boolean> {
  const addon = await prisma.userAddOn.findFirst({
    where: { userId, type, endsAt: { gt: new Date() } },
  });
  return Boolean(addon);
}

export async function getActiveAddOns(userId: string) {
  return prisma.userAddOn.findMany({
    where: { userId, endsAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDeviceLimitForUser(user: Pick<User, 'id' | 'proUntil'>): Promise<number> {
  const { isPro } = await import('@/lib/auth/plan');
  const baseLimit = isPro(user) ? 2 : 1;
  if (!isPro(user)) return baseLimit;
  const extraDevices = await prisma.userAddOn.count({
    where: { userId: user.id, type: 'EXTRA_DEVICE', endsAt: { gt: new Date() } },
  });
  return baseLimit + extraDevices;
}

export async function isWhiteLabelActive(userId: string): Promise<boolean> {
  return hasActiveAddOn(userId, 'WHITE_LABEL');
}
