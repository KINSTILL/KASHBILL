import { prisma } from '@/lib/db';
import type { AddOnType, User } from '@prisma/client';

export const ADDON_PRICES = {
  EXTRA_DEVICE: 500,
  CUSTOM_WHATSAPP: 0,
  WHITE_LABEL: 1000,
} as const;

/**
 * Mapping historique montant → type d'add-on.
 * Sert de repli pour les abonnements sans type explicite.
 */
export function resolveAddOnTypeFromAmount(amountXaf: number | null | undefined): AddOnType | null {
  if (amountXaf === 3000 || amountXaf === 1000) return 'WHITE_LABEL';
  if (amountXaf === 500 || amountXaf === 300) return 'EXTRA_DEVICE';
  return null;
}

export async function hasActiveAddOn(userId: string, type: AddOnType): Promise<boolean> {
  const addon = await prisma.userAddOn.findFirst({
    where: { userId, type, endsAt: { gt: new Date() } },
  });
  return Boolean(addon);
}

/**
 * Vérifie si l'utilisateur possède un abonnement Pro payant actif.
 * Les utilisateurs gratuits et les utilisateurs en période d'essai
 * ne peuvent JAMAIS souscrire à des add-ons (WHITE_LABEL, EXTRA_DEVICE, etc.).
 */
export async function hasPaidProSubscription(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, proUntil: true, createdAt: true, role: true },
  });
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'SUPPORT') return true;

  const { isPro, isInTrial } = await import('@/lib/auth/plan');
  if (!isPro(user) || isInTrial(user)) return false;

  const now = new Date();
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      addOnType: null,
      endsAt: { gt: now },
      source: { in: ['NOTCH_PAY', 'ADMIN_GIFT'] },
    },
    select: { id: true, startsAt: true, endsAt: true },
  });

  if (!sub) return false;
  // Exclure les initialisations en attente ou abandonnées
  return sub.endsAt.getTime() > sub.startsAt.getTime();
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
  if (user.role === 'ADMIN' || user.role === 'SUPPORT') return true;
  const { isPro } = await import('@/lib/auth/plan');
  if (isPro(user)) return true;
  return hasActiveAddOn(userId, 'CUSTOM_WHATSAPP');
}

