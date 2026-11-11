import { describe, it, expect, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as webhookRoute } from '@/app/api/webhooks/notchpay/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

async function registerAndGetUserId(phone: string): Promise<{ userId: string; cookie: string }> {
  const formattedPhone = phone.startsWith('+237') ? phone : `+237${phone}`;
  const res = await registerRoute(
    new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch' },
      body: JSON.stringify({
        phone: formattedPhone,
        pin: '123456',
        deviceId: 'device-test-1',
        locale: 'FR',
      }),
    })
  );
  const json = await res.json();
  const cookie = res.headers.get('set-cookie')?.match(/mycashbill_session=([^;]+)/)?.[1] ?? '';
  return { userId: json.user.id, cookie };
}

async function createSubscription(userId: string, providerRef: string) {
  return prisma.subscription.create({
    data: {
      userId,
      source: 'NOTCH_PAY',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amountXaf: 2000,
      providerRef,
    },
  });
}

describe('POST /api/webhooks/notchpay', () => {
  it('rejette une signature invalide', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/notchpay', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-notchpay-signature': 'invalid' },
      body: JSON.stringify({ event: 'payment.complete', data: { reference: 'x' } }),
    });
    const res = await webhookRoute(req);
    expect(res.status).toBe(401);
  });

  it('active le Pro si signature valide et event payment.complete', async () => {
    const { userId } = await registerAndGetUserId('699111111');
    await createSubscription(userId, 'PROVIDER_REF_1');

    const body = JSON.stringify({
      event: 'payment.complete',
      data: { reference: 'PROVIDER_REF_1', status: 'complete', amount: 2000 },
    });
    const sig = createHmac('sha256', env.NOTCHPAY_WEBHOOK_HASH).update(body).digest('hex');

    const req = new NextRequest('http://localhost/api/webhooks/notchpay', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-notchpay-signature': sig },
      body,
    });
    const res = await webhookRoute(req);
    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.proUntil).not.toBeNull();
    expect(user!.proUntil!.getTime()).toBeGreaterThan(Date.now() + 20 * 24 * 60 * 60 * 1000);
  });

  it('est idempotent (2 webhooks identiques → 1 seule activation)', async () => {
    const { userId } = await registerAndGetUserId('699222222');
    await createSubscription(userId, 'PROVIDER_REF_2');

    const body = JSON.stringify({
      event: 'payment.complete',
      data: { reference: 'PROVIDER_REF_2', status: 'complete' },
    });
    const sig = createHmac('sha256', env.NOTCHPAY_WEBHOOK_HASH).update(body).digest('hex');

    const makeReq = () =>
      new NextRequest('http://localhost/api/webhooks/notchpay', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-notchpay-signature': sig },
        body,
      });

    await webhookRoute(makeReq());
    const first = await prisma.user.findUnique({ where: { id: userId } });
    const firstProUntil = first!.proUntil!.getTime();

    await new Promise((r) => setTimeout(r, 100));
    await webhookRoute(makeReq());
    const second = await prisma.user.findUnique({ where: { id: userId } });
    expect(second!.proUntil!.getTime()).toBe(firstProUntil);
  });

  it('log un échec sans activer le Pro', async () => {
    const { userId } = await registerAndGetUserId('699333333');
    await createSubscription(userId, 'PROVIDER_REF_3');

    const body = JSON.stringify({
      event: 'payment.failed',
      data: { reference: 'PROVIDER_REF_3', status: 'failed' },
    });
    const sig = createHmac('sha256', env.NOTCHPAY_WEBHOOK_HASH).update(body).digest('hex');

    const req = new NextRequest('http://localhost/api/webhooks/notchpay', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-notchpay-signature': sig },
      body,
    });
    await webhookRoute(req);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    // proUntil reste au trial (3 jours) créé à l'inscription
    expect(user?.proUntil).not.toBeNull();
    expect(user!.proUntil!.getTime()).toBeLessThan(Date.now() + 10 * 24 * 60 * 60 * 1000);
  });
});

describe('POST /api/webhooks/notchpay — add-ons', () => {
  function signedRequest(body: string): NextRequest {
    const sig = createHmac('sha256', env.NOTCHPAY_WEBHOOK_HASH).update(body).digest('hex');
    return new NextRequest('http://localhost/api/webhooks/notchpay', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-notchpay-signature': sig },
      body,
    });
  }

  async function createAddOnSubscription(userId: string, providerRef: string, amountXaf: number) {
    // Ligne en attente, comme créée par /api/addons/initialize (startsAt = endsAt = maintenant)
    const now = new Date();
    return prisma.subscription.create({
      data: {
        userId,
        source: 'NOTCH_PAY',
        startsAt: now,
        endsAt: now,
        amountXaf,
        providerRef,
      },
    });
  }

  it('crée un UserAddOn EXTRA_DEVICE actif (30 jours) à la confirmation du paiement', async () => {
    const { userId } = await registerAndGetUserId('699444444');
    const sub = await createAddOnSubscription(userId, 'ADDON_REF_1', 500);

    const body = JSON.stringify({
      event: 'payment.complete',
      data: { reference: 'ADDON_REF_1', status: 'complete', amount: 500 },
    });
    const res = await webhookRoute(signedRequest(body));
    expect(res.status).toBe(200);

    const addons = await prisma.userAddOn.findMany({ where: { userId } });
    expect(addons).toHaveLength(1);
    expect(addons[0]!.type).toBe('EXTRA_DEVICE');
    expect(addons[0]!.subscriptionId).toBe(sub.id);
    expect(addons[0]!.endsAt.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);

    // La subscription devient active
    const updated = await prisma.subscription.findUnique({ where: { id: sub.id } });
    expect(updated!.endsAt.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
  });

  it('ne modifie pas proUntil lors d\'un achat d\'add-on', async () => {
    const { userId } = await registerAndGetUserId('699555555');
    const before = await prisma.user.findUnique({ where: { id: userId } });
    await createAddOnSubscription(userId, 'ADDON_REF_2', 3000);

    const body = JSON.stringify({
      event: 'payment.complete',
      data: { reference: 'ADDON_REF_2', status: 'complete', amount: 3000 },
    });
    await webhookRoute(signedRequest(body));

    const after = await prisma.user.findUnique({ where: { id: userId } });
    expect(after!.proUntil!.getTime()).toBe(before!.proUntil!.getTime());
    const types = (await prisma.userAddOn.findMany({ where: { userId } })).map((a) => a.type);
    expect(types).toEqual(['WHITE_LABEL']);
  });

  it('est idempotent : un webhook rejoué ne crée pas de second add-on', async () => {
    const { userId } = await registerAndGetUserId('699666666');
    await createAddOnSubscription(userId, 'ADDON_REF_3', 1000);

    const body = JSON.stringify({
      event: 'payment.complete',
      data: { reference: 'ADDON_REF_3', status: 'complete', amount: 1000 },
    });
    await webhookRoute(signedRequest(body));
    await new Promise((r) => setTimeout(r, 100));
    await webhookRoute(signedRequest(body));

    const addons = await prisma.userAddOn.findMany({ where: { userId } });
    expect(addons).toHaveLength(1);
    expect(addons[0]!.type).toBe('CUSTOM_WHATSAPP');
  });

  it('n\'active aucun add-on sur un échec de paiement', async () => {
    const { userId } = await registerAndGetUserId('699777777');
    await createAddOnSubscription(userId, 'ADDON_REF_4', 500);

    const body = JSON.stringify({
      event: 'payment.failed',
      data: { reference: 'ADDON_REF_4', status: 'failed' },
    });
    await webhookRoute(signedRequest(body));

    expect(await prisma.userAddOn.count({ where: { userId } })).toBe(0);
  });
});

