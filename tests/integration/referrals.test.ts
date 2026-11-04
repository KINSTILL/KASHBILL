import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as createDocRoute } from '@/app/api/documents/route';
import { POST as markSentRoute } from '@/app/api/documents/[id]/mark-sent/route';
import { GET as referralsMeRoute } from '@/app/api/referrals/me/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

describe('Parrainage complet', () => {
  it('active le parrainage après 1er document envoyé', async () => {
    // Parrain
    const parrainRes = await registerRoute(
      new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch' },
        body: JSON.stringify({
          phone: '+237699111111',
          pin: '123456',
          deviceId: 'device-parrain-1',
          locale: 'FR',
        }),
      })
    );
    expect(parrainRes.status).toBe(201);
    const parrain = await parrainRes.json();
    const parrainCookie =
      parrainRes.headers.get('set-cookie')?.match(/cashbill_session=([^;]+)/)?.[1] ?? '';
    const code = parrain.user.referralCode;

    // Filleul
    const filleulRes = await registerRoute(
      new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch' },
        body: JSON.stringify({
          phone: '+237699222222',
          pin: '123456',
          deviceId: 'device-filleul-1',
          locale: 'FR',
          referredByCode: code,
        }),
      })
    );
    expect(filleulRes.status).toBe(201);
    const filleul = await filleulRes.json();
    const cookie =
      filleulRes.headers.get('set-cookie')?.match(/cashbill_session=([^;]+)/)?.[1] ?? '';

    // Le filleul crée et envoie un document
    const docRes = await createDocRoute(
      new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-requested-with': 'fetch',
          cookie: `cashbill_session=${cookie}`,
        },
        body: JSON.stringify({
          type: 'DEVIS',
          locale: 'FR',
          payload: {
            lines: [{ description: 'X', quantity: 1, unitPrice: 1000 }],
            vatRate: null,
            depositPercentage: null,
            deliveryFee: null,
            notes: null,
          },
        }),
      })
    );
    expect(docRes.status).toBe(201);
    const { documentId } = await docRes.json();

    const markRes = await markSentRoute(
      new NextRequest(`http://localhost/api/documents/${documentId}/mark-sent`, {
        method: 'POST',
        headers: { 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
      }),
      { params: Promise.resolve({ id: documentId }) }
    );
    expect(markRes.status).toBe(200);

    // Vérifier que le parrainage est activé
    const referral = await prisma.referral.findUnique({
      where: { filleulId: filleul.user.id },
    });
    expect(referral?.status).toBe('REWARDED');

    // Vérifier que le parrain a reçu +7 jours
    const parrainDb = await prisma.user.findUnique({
      where: { id: parrain.user.id },
    });
    expect(parrainDb?.proUntil).not.toBeNull();
    expect(parrainDb!.proUntil!.getTime()).toBeGreaterThan(Date.now());

    // Vérifier GET /api/referrals/me pour le parrain
    const meRes = await referralsMeRoute(
      new NextRequest('http://localhost/api/referrals/me', {
        headers: { cookie: `cashbill_session=${parrainCookie}` },
      })
    );
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.stats.total).toBe(1);
    expect(meData.stats.activated).toBe(1);
    expect(meData.stats.proDaysEarned).toBe(7);
  });
});
