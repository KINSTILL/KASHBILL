import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { DELETE as deleteAccountRoute } from '@/app/api/auth/me/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

async function registerAndGetCookie(phone: string): Promise<string> {
  const res = await registerRoute(
    new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch' },
      body: JSON.stringify({ phone, pin: '123456', deviceId: 'device-1', locale: 'FR' }),
    })
  );
  const setCookie = res.headers.get('set-cookie') ?? '';
  return setCookie.match(/mycashbill_session=([^;]+)/)?.[1] ?? '';
}

function deleteReq(cookie: string, pin: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/me', {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      'x-requested-with': 'fetch',
      cookie: `mycashbill_session=${cookie}`,
    },
    body: JSON.stringify({ pin }),
  });
}

describe('DELETE /api/auth/me', () => {
  it('rejette un PIN incorrect et conserve le compte', async () => {
    const cookie = await registerAndGetCookie('699777771');
    const res = await deleteAccountRoute(deleteReq(cookie, '000000'));
    expect(res.status).toBe(401);
    expect(await prisma.user.count()).toBe(1);
  });

  it('supprime le compte et ses données avec le bon PIN', async () => {
    const cookie = await registerAndGetCookie('699777772');
    await prisma.client.create({
      data: { name: 'Client test', userId: (await prisma.user.findFirstOrThrow()).id },
    });

    const res = await deleteAccountRoute(deleteReq(cookie, '123456'));
    expect(res.status).toBe(200);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.client.count()).toBe(0);
    expect(await prisma.device.count()).toBe(0);
  });

  it('refuse sans session', async () => {
    const res = await deleteAccountRoute(deleteReq('', '123456'));
    expect(res.status).toBe(401);
  });

  it('refuse la suppression d’un compte administrateur', async () => {
    const cookie = await registerAndGetCookie('699777773');
    await prisma.user.updateMany({ data: { role: 'ADMIN' } });
    const res = await deleteAccountRoute(deleteReq(cookie, '123456'));
    expect(res.status).toBe(403);
    expect(await prisma.user.count()).toBe(1);
  });
});

