import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { clearDatabase } from '../../helpers/db';
import { createTestUser, resetUserCounter } from '../../helpers/factories';
import {
  isPro,
  isInTrial,
  isWithinLogoGracePeriod,
  shouldShowWatermark,
  shouldShowProField,
  getClientsLimit,
  getProductPhotosLimit,
  getDuplicationsLimit,
  getRenumerationsLimit,
  getEditsPerDocumentLimit,
  getHistoryWindowDays,
} from '@/lib/auth/plan';
import { maybeResetMonthlyCounters } from '@/lib/auth/plan-server';
import {
  FREE_CLIENTS_LIMIT,
  FREE_HISTORY_DAYS,
  FREE_PRODUCT_PHOTOS_LIMIT,
  FREE_DUPLICATIONS_PER_MONTH,
  FREE_RENUMERATIONS_PER_MONTH,
  FREE_EDITS_PER_DOCUMENT,
} from '@/lib/constants';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

describe('isPro', () => {
  it('false si proUntil null', () => {
    expect(isPro({ proUntil: null })).toBe(false);
  });

  it('true si proUntil dans le futur', () => {
    expect(isPro({ proUntil: new Date(Date.now() + 86400_000) })).toBe(true);
  });

  it('false si proUntil dans le passé', () => {
    expect(isPro({ proUntil: new Date(Date.now() - 1000) })).toBe(false);
  });
});

describe('isInTrial', () => {
  it('true pour un compte récent avec proUntil proche', async () => {
    const user = await createTestUser({
      proUntil: new Date(Date.now() + 2 * 86400_000),
    });
    // createdAt ≈ maintenant, proUntil = +2 jours → dans la fenêtre TRIAL (3j)
    expect(isInTrial(user)).toBe(true);
  });

  it('false pour un compte gratuit', async () => {
    const user = await createTestUser({ proUntil: null });
    expect(isInTrial(user)).toBe(false);
  });
});

describe('isWithinLogoGracePeriod', () => {
  it('true pour un compte récent', async () => {
    const user = await createTestUser();
    expect(isWithinLogoGracePeriod(user)).toBe(true);
  });

  it('false pour un compte ancien', async () => {
    const user = await createTestUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { createdAt: new Date(Date.now() - 60 * 86400_000) },
    });
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(isWithinLogoGracePeriod(updated!)).toBe(false);
  });
});

describe('shouldShowWatermark', () => {
  it('true en gratuit', () => {
    expect(shouldShowWatermark({ proUntil: null })).toBe(true);
  });

  it('false en Pro', () => {
    expect(shouldShowWatermark({ proUntil: new Date(Date.now() + 86400_000) })).toBe(false);
  });
});

describe('getClientsLimit / getHistoryWindowDays', () => {
  it('limite gratuite à 3 clients', () => {
    expect(getClientsLimit({ proUntil: null })).toBe(FREE_CLIENTS_LIMIT);
  });

  it('illimité en Pro', () => {
    expect(getClientsLimit({ proUntil: new Date(Date.now() + 86400_000) })).toBe(Infinity);
  });

  it('historique 7 jours en gratuit, null (illimité) en Pro', () => {
    expect(getHistoryWindowDays({ proUntil: null })).toBe(FREE_HISTORY_DAYS);
    expect(getHistoryWindowDays({ proUntil: new Date(Date.now() + 86400_000) })).toBeNull();
  });
});

describe('shouldShowProField', () => {
  it('true en Pro', () => {
    expect(shouldShowProField({ proUntil: new Date(Date.now() + 86400_000), createdAt: new Date() })).toBe(true);
  });

  it('true en période de grâce même sans Pro', () => {
    expect(shouldShowProField({ proUntil: null, createdAt: new Date() })).toBe(true);
  });

  it('false si ni Pro ni en période de grâce', () => {
    const old = new Date(Date.now() - 60 * 86400_000);
    expect(shouldShowProField({ proUntil: null, createdAt: old })).toBe(false);
  });
});

describe('freemium limits', () => {
  it('limites en gratuit', () => {
    expect(getProductPhotosLimit({ proUntil: null })).toBe(FREE_PRODUCT_PHOTOS_LIMIT);
    expect(getDuplicationsLimit({ proUntil: null })).toBe(FREE_DUPLICATIONS_PER_MONTH);
    expect(getRenumerationsLimit({ proUntil: null })).toBe(FREE_RENUMERATIONS_PER_MONTH);
    expect(getEditsPerDocumentLimit({ proUntil: null })).toBe(FREE_EDITS_PER_DOCUMENT);
  });

  it('limites en Pro (illimité)', () => {
    const pro = { proUntil: new Date(Date.now() + 86400_000) };
    expect(getProductPhotosLimit(pro)).toBe(Infinity);
    expect(getDuplicationsLimit(pro)).toBe(Infinity);
    expect(getRenumerationsLimit(pro)).toBe(Infinity);
    expect(getEditsPerDocumentLimit(pro)).toBe(Infinity);
  });
});

describe('maybeResetMonthlyCounters', () => {
  it('reset si on a changé de mois', async () => {
    const user = await createTestUser();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        duplicationsThisMonth: 3,
        renumerationsThisMonth: 1,
        monthlyCountersResetAt: new Date('2025-01-01T00:00:00Z'),
      },
    });
    const stale = await prisma.user.findUnique({ where: { id: user.id } });
    await maybeResetMonthlyCounters(stale!);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated!.duplicationsThisMonth).toBe(0);
    expect(updated!.renumerationsThisMonth).toBe(0);
  });

  it('ne reset pas si même mois', async () => {
    const user = await createTestUser();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        duplicationsThisMonth: 2,
        monthlyCountersResetAt: new Date(),
      },
    });
    const current = await prisma.user.findUnique({ where: { id: user.id } });
    await maybeResetMonthlyCounters(current!);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated!.duplicationsThisMonth).toBe(2);
  });
});
