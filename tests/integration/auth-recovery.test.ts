import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as recoveryRoute } from '@/app/api/auth/recovery/use/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

describe('POST /api/auth/recovery/use', () => {
  it('consomme un code et change le PIN', async () => {
    const regReq = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'fetch',
      },
      body: JSON.stringify({
        phone: '699666666',
        pin: '123456',
        deviceId: 'device-1',
        locale: 'FR',
      }),
    });
    const regRes = await registerRoute(regReq);
    const regJson = await regRes.json();
    const code = regJson.recoveryCodes[0];

    const recReq = new NextRequest('http://localhost/api/auth/recovery/use', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'fetch',
      },
      body: JSON.stringify({
        phone: '699666666',
        recoveryCode: code,
        newPin: '999999',
        deviceId: 'device-2',
      }),
    });
    const recRes = await recoveryRoute(recReq);
    expect(recRes.status).toBe(200);

    const updated = await prisma.user.findUnique({ where: { phone: '+237699666666' } });
    expect(updated).not.toBeNull();

    const oldDevice = await prisma.device.findFirst({
      where: { userId: updated!.id, deviceId: 'device-1' },
    });
    expect(oldDevice?.revokedAt).not.toBeNull();
  });

  it('rejette un code déjà consommé', async () => {
    const regReq = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'fetch',
      },
      body: JSON.stringify({
        phone: '699777777',
        pin: '123456',
        deviceId: 'device-1',
        locale: 'FR',
      }),
    });
    const regRes = await registerRoute(regReq);
    const regJson = await regRes.json();
    const code = regJson.recoveryCodes[0];

    const makeReq = () =>
      new NextRequest('http://localhost/api/auth/recovery/use', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-requested-with': 'fetch',
        },
        body: JSON.stringify({
          phone: '699777777',
          recoveryCode: code,
          newPin: '999999',
          deviceId: 'device-2',
        }),
      });

    const first = await recoveryRoute(makeReq());
    expect(first.status).toBe(200);

    const second = await recoveryRoute(makeReq());
    expect(second.status).toBe(400);
  });
});
