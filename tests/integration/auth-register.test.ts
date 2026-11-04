import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

function buildReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-requested-with': 'fetch',
      'user-agent': 'test',
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  phone: '699111111',
  pin: '123456',
  deviceId: 'device-uuid-1',
  locale: 'FR',
};

describe('POST /api/auth/register', () => {
  it('crée un utilisateur avec trial 3 jours', async () => {
    const res = await registerRoute(buildReq(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user.phone).toBe('+237699111111');
    expect(json.user.role).toBe('USER');
    expect(json.recoveryCodes).toHaveLength(8);
    expect(new Date(json.user.proUntil).getTime()).toBeGreaterThan(Date.now());

    const sub = await prisma.subscription.findFirst({ where: { userId: json.user.id } });
    expect(sub?.source).toBe('TRIAL');
  });

  it('rejette un numéro déjà utilisé', async () => {
    await registerRoute(buildReq(validBody));
    const res = await registerRoute(buildReq({ ...validBody, deviceId: 'device-2' }));
    expect(res.status).toBe(409);
  });

  it('rejette un PIN invalide (zod)', async () => {
    const res = await registerRoute(buildReq({ ...validBody, pin: '123' }));
    expect(res.status).toBe(422);
  });

  it('rejette sans X-Requested-With', async () => {
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    const res = await registerRoute(req);
    expect(res.status).toBe(403);
  });

  it('crée un Referral PENDING avec un code valide', async () => {
    const first = await registerRoute(buildReq(validBody));
    const firstJson = await first.json();
    const code = firstJson.user.referralCode;

    const res = await registerRoute(
      buildReq({
        ...validBody,
        phone: '699222222',
        deviceId: 'device-2',
        referredByCode: code,
      })
    );
    expect(res.status).toBe(201);
    const json = await res.json();

    const referral = await prisma.referral.findUnique({
      where: { filleulId: json.user.id },
    });
    expect(referral).not.toBeNull();
    expect(referral!.status).toBe('PENDING');
  });

  it('ignore un code de parrainage invalide', async () => {
    const res = await registerRoute(
      buildReq({ ...validBody, referredByCode: 'ZZZZZZZZ' })
    );
    expect(res.status).toBe(201);
  });
});

