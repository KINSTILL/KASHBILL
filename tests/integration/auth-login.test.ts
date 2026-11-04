import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as loginRoute } from '@/app/api/auth/login/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

function buildReq(url: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-requested-with': 'fetch',
      'user-agent': 'test',
    },
    body: JSON.stringify(body),
  });
}

const user = {
  phone: '699333333',
  pin: '123456',
  deviceId: 'device-a',
  locale: 'FR',
};

describe('POST /api/auth/login', () => {
  it('connecte un utilisateur avec PIN valide', async () => {
    await registerRoute(buildReq('/api/auth/register', user));
    const res = await loginRoute(
      buildReq('/api/auth/login', {
        phone: user.phone,
        pin: user.pin,
        deviceId: user.deviceId,
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.user.phone).toBe('+237699333333');
  });

  it('rejette un mauvais PIN', async () => {
    await registerRoute(buildReq('/api/auth/register', user));
    const res = await loginRoute(
      buildReq('/api/auth/login', {
        phone: user.phone,
        pin: '999999',
        deviceId: user.deviceId,
      })
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('retourne DEVICE_LIMIT_REACHED sur un 2e device en gratuit', async () => {
    await registerRoute(buildReq('/api/auth/register', user));
    await prisma.user.update({
      where: { phone: '+237699333333' },
      data: { proUntil: null },
    });
    const res = await loginRoute(
      buildReq('/api/auth/login', {
        phone: user.phone,
        pin: user.pin,
        deviceId: 'device-b',
      })
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe('DEVICE_LIMIT_REACHED');
    expect(json.error.details.activeDevices).toHaveLength(1);
  });
});
