import { prisma } from '@/lib/db';
import type { AddOnType, User } from '@prisma/client';

export const ADDON_PRICES = {
  EXTRA_DEVICE: 300,
  CUSTOM_WHATSAPP: 500,
  WHITE_LABEL: 3000,
} as const;

/**
 * Mapping historique montant → type d'add-on (anciens prix : 500 / 1000 / 3000).
 * Sert UNIQUEMENT de repli pour les subscriptions créées avant l'ajout de
 * `Subscription.addOnType`. Les nouveaux achats portent le type explicitement.
 */
export function resolveAddOnTypeFromAmount(amountXaf: number | null | undefined): AddOnType | null {
  if (amountXaf === 3000) return 'WHITE_LABEL';
  if (amountXaf === 1000) return 'CUSTOM_WHATSAPP';
  if (amountXaf === 500) return 'EXTRA_DEVICE';
  return null;
}

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

export async function isCustomWhatsAppActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, proUntil: true, role: true },
  });
  if (!user) return false;
  const { isPro } = await import('@/lib/auth/plan');
  if (isPro(user)) return true;
  return hasActiveAddOn(userId, 'CUSTOM_WHATSAPP');
}

