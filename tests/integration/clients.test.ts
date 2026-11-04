import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as createClientRoute } from '@/app/api/clients/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

async function registerAndGetCookie(phone: string): Promise<string> {
  const req = new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch' },
    body: JSON.stringify({ phone, pin: '123456', deviceId: 'device-1', locale: 'FR' }),
  });
  const res = await registerRoute(req);
  const setCookie = res.headers.get('set-cookie') ?? '';
  return setCookie.match(/cashbill_session=([^;]+)/)?.[1] ?? '';
}

describe('POST /api/clients', () => {
  it('crée un client', async () => {
    const cookie = await registerAndGetCookie('699111111');
    const req = new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
      body: JSON.stringify({ name: 'Jean Dupont', phone: '699222222' }),
    });
    const res = await createClientRoute(req);
    expect(res.status).toBe(201);
  });

  it('rejette le 4e client en gratuit', async () => {
    const cookie = await registerAndGetCookie('699111111');
    // Le compte nouvellement créé a un essai Pro par défaut. On retire le Pro pour tester la limite gratuite.
    await prisma.user.updateMany({ data: { proUntil: null } });

    for (let i = 0; i < 3; i++) {
      const res = await createClientRoute(new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
        body: JSON.stringify({ name: `Client ${i}` }),
      }));
      expect(res.status).toBe(201);
    }
    const res = await createClientRoute(new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
      body: JSON.stringify({ name: 'Client 4' }),
    }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe('PLAN_LIMIT_REACHED');
  });
});

