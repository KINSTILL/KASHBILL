import type { User } from '@prisma/client';
import {
  FREE_CLIENTS_LIMIT,
  FREE_DUPLICATIONS_PER_MONTH,
  FREE_EDITS_PER_DOCUMENT,
  FREE_HISTORY_DAYS,
  FREE_LOGO_GRACE_DAYS,
  FREE_PRODUCT_PHOTOS_LIMIT,
  FREE_RENUMERATIONS_PER_MONTH,
  TRIAL_DURATION_DAYS,
} from '@/lib/constants';

export type PlanUser = {
  proUntil?: Date | string | null;
  createdAt?: Date | string;
};

export function isPro(user: Pick<User, 'proUntil'> | PlanUser): boolean {
  if (!user.proUntil) return false;
  const d = typeof user.proUntil === 'string' ? new Date(user.proUntil) : user.proUntil;
  return d > new Date();
}

export function isInTrial(user: Pick<User, 'proUntil' | 'createdAt'> | PlanUser): boolean {
  if (!isPro(user) || !user.createdAt) return false;
  const createdAtDate = typeof user.createdAt === 'string' ? new Date(user.createdAt) : user.createdAt;
  const trialEnd = new Date(createdAtDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const proDate = typeof user.proUntil === 'string' ? new Date(user.proUntil) : user.proUntil;
  return proDate !== null && proDate !== undefined && proDate <= trialEnd;
}

/**
 * Vérifie si l'utilisateur bénéficie d'un statut Pro payé (ou accordé par l'admin),
 * excluant formellement la période d'essai gratuit.
 */
export function isPaidProUser(user: Pick<User, 'proUntil' | 'createdAt'> | PlanUser): boolean {
  return isPro(user) && !isInTrial(user);
}

export function isWithinLogoGracePeriod(user: Pick<User, 'createdAt'> | { createdAt?: Date | string }): boolean {
  if (!user.createdAt) return false;
  const createdAtDate = typeof user.createdAt === 'string' ? new Date(user.createdAt) : user.createdAt;
  const graceEnd = new Date(createdAtDate.getTime() + FREE_LOGO_GRACE_DAYS * 24 * 60 * 60 * 1000);
  return new Date() < graceEnd;
}

export function shouldShowProField(
  user: (Pick<User, 'proUntil' | 'createdAt'> | PlanUser)
): boolean {
  return isPro(user) || isWithinLogoGracePeriod(user);
}

export function shouldShowWatermark(user: Pick<User, 'proUntil'>): boolean {
  return !isPro(user);
}

export function getHistoryWindowDays(user: Pick<User, 'proUntil'>): number | null {
  return isPro(user) ? null : FREE_HISTORY_DAYS;
}

export function getClientsLimit(user: Pick<User, 'proUntil'>): number {
  return isPro(user) ? Infinity : FREE_CLIENTS_LIMIT;
}

export function getProductPhotosLimit(user: Pick<User, 'proUntil'>): number {
  return isPro(user) ? Infinity : FREE_PRODUCT_PHOTOS_LIMIT;
}

export function getDuplicationsLimit(user: Pick<User, 'proUntil'>): number {
  return isPro(user) ? Infinity : FREE_DUPLICATIONS_PER_MONTH;
}

export function getRenumerationsLimit(user: Pick<User, 'proUntil'>): number {
  return isPro(user) ? Infinity : FREE_RENUMERATIONS_PER_MONTH;
}

export function getEditsPerDocumentLimit(user: Pick<User, 'proUntil'>): number {
  return isPro(user) ? Infinity : FREE_EDITS_PER_DOCUMENT;
}

