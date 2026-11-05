import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { GET as devicesRoute } from '@/app/api/auth/devices/route';
import { DELETE as deleteDeviceRoute } from '@/app/api/auth/devices/[id]/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

async function registerAndGetCookie(phone: string, deviceId: string): Promise<string> {
  const req = new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-requested-with': 'fetch',
    },
    body: JSON.stringify({ phone, pin: '123456', deviceId, locale: 'FR' }),
  });
  const res = await registerRoute(req);
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/mycashbill_session=([^;]+)/);
  return match ? match[1]! : '';
}

describe('/api/auth/devices', () => {
  it('liste les appareils actifs avec isCurrent', async () => {
    const cookie = await registerAndGetCookie('699444444', 'device-x');
    const req = new NextRequest('http://localhost/api/auth/devices', {
      headers: { cookie: `mycashbill_session=${cookie}` },
    });
    const res = await devicesRoute(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.devices).toHaveLength(1);
    expect(json.devices[0].isCurrent).toBe(true);
  });

  it('révoque un appareil', async () => {
    const cookie = await registerAndGetCookie('699555555', 'device-y');
    const req = new NextRequest('http://localhost/api/auth/devices/device-y', {
      method: 'DELETE',
      headers: {
        cookie: `mycashbill_session=${cookie}`,
        'x-requested-with': 'fetch',
      },
    });
    const res = await deleteDeviceRoute(req, {
      params: Promise.resolve({ id: 'device-y' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.loggedOut).toBe(true);
  });
});

