import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as createDocRoute } from '@/app/api/documents/route';
import { clearDatabase } from '../helpers/db';
import { resetUserCounter } from '../helpers/factories';
import { NextRequest } from 'next/server';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

describe('Public /verify/[token]', () => {
  it('le token retourné par POST /api/documents est vérifiable', async () => {
    const regRes = await registerRoute(new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch' },
      body: JSON.stringify({ phone: '699777777', pin: '123456', deviceId: 'device-1', locale: 'FR' }),
    }));
    const cookie = regRes.headers.get('set-cookie')?.match(/cashbill_session=([^;]+)/)?.[1] ?? '';

    const docRes = await createDocRoute(new NextRequest('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
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
    }));
    const { publicToken } = await docRes.json();
    expect(publicToken).toBeTruthy();
    expect(typeof publicToken).toBe('string');
    expect(publicToken.length).toBeGreaterThan(15);
  });
});

