import { prisma } from '@/lib/db';
import type { User } from '@prisma/client';
import { isPro } from '@/lib/auth/plan';
import {
  FREE_CLIENTS_LIMIT,
  FREE_DOCS_PER_MONTH,
  FREE_WHATSAPP_PER_MONTH,
} from '@/lib/constants';

export type QuotaStatus = {
  used: number;
  limit: number | null; // null = illimité (Pro)
  remaining: number | null;
  reached: boolean;
};

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function checkDocQuota(user: User): Promise<QuotaStatus> {
  if (isPro(user)) return { used: 0, limit: null, remaining: null, reached: false };
  const used = await prisma.document.count({
    where: { userId: user.id, createdAt: { gte: startOfMonth() } },
  });
  return {
    used,
    limit: FREE_DOCS_PER_MONTH,
    remaining: Math.max(0, FREE_DOCS_PER_MONTH - used),
    reached: used >= FREE_DOCS_PER_MONTH,
  };
}

export async function checkWhatsAppQuota(user: User): Promise<QuotaStatus> {
  if (isPro(user)) return { used: 0, limit: null, remaining: null, reached: false };
  const used = await prisma.document.count({
    where: {
      userId: user.id,
      sentViaWhatsAppAt: { not: null, gte: startOfMonth() },
    },
  });
  return {
    used,
    limit: FREE_WHATSAPP_PER_MONTH,
    remaining: Math.max(0, FREE_WHATSAPP_PER_MONTH - used),
    reached: used >= FREE_WHATSAPP_PER_MONTH,
  };
}

export async function checkClientQuota(user: User): Promise<QuotaStatus> {
  if (isPro(user)) return { used: 0, limit: null, remaining: null, reached: false };
  const used = await prisma.client.count({ where: { userId: user.id } });
  return {
    used,
    limit: FREE_CLIENTS_LIMIT,
    remaining: Math.max(0, FREE_CLIENTS_LIMIT - used),
    reached: used >= FREE_CLIENTS_LIMIT,
  };
}

export async function getFullQuotaStatus(user: User): Promise<{
  isPro: boolean;
  docs: QuotaStatus;
  whatsapp: QuotaStatus;
  emails: QuotaStatus;
  clients: QuotaStatus;
}> {
  const [docs, whatsapp, clients] = await Promise.all([
    checkDocQuota(user),
    checkWhatsAppQuota(user),
    checkClientQuota(user),
  ]);
  // `emails` n'a plus de quota (envoi email de documents retiré) : conservé pour compat
  // de la signature consommée par components/layout/QuotaBadge.tsx:14.
  return {
    isPro: isPro(user),
    docs,
    whatsapp,
    emails: { used: 0, limit: 0, remaining: 0, reached: false },
    clients,
  };
}

