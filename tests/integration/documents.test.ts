import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as createDocRoute } from '@/app/api/documents/route';
import { POST as markSentRoute } from '@/app/api/documents/[id]/mark-sent/route';
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
  return res.headers.get('set-cookie')?.match(/cashbill_session=([^;]+)/)?.[1] ?? '';
}

const basePayload = {
  type: 'FACTURE' as const,
  locale: 'FR' as const,
  payload: {
    lines: [{ description: 'Service', quantity: 1, unitPrice: 50000 }],
    vatRate: null,
    depositPercentage: null,
    deliveryFee: null,
    notes: null,
  },
};

describe('POST /api/documents', () => {
  it('crée un document avec numérotation atomique et hash', async () => {
    const cookie = await registerAndGetCookie('699333333');
    const res = await createDocRoute(new NextRequest('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
      body: JSON.stringify(basePayload),
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.number).toMatch(/^CB-\d{4}-\d{6}$/);
    expect(json.publicToken).toBeDefined();

    const doc = await prisma.document.findUnique({ where: { id: json.documentId } });
    expect(doc?.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('génère des numéros séquentiels', async () => {
    const cookie = await registerAndGetCookie('699444444');
    const makeReq = () => new NextRequest('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
      body: JSON.stringify(basePayload),
    });
    const r1 = await (await createDocRoute(makeReq())).json();
    const r2 = await (await createDocRoute(makeReq())).json();
    expect(r1.number).toMatch(/000001$/);
    expect(r2.number).toMatch(/000002$/);
  });

  it('marque un document comme envoyé', async () => {
    const cookie = await registerAndGetCookie('699555555');
    const createRes = await createDocRoute(new NextRequest('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
      body: JSON.stringify(basePayload),
    }));
    const { documentId } = await createRes.json();

    const res = await markSentRoute(
      new NextRequest(`http://localhost/api/documents/${documentId}/mark-sent`, {
        method: 'POST',
        headers: { 'x-requested-with': 'fetch', cookie: `cashbill_session=${cookie}` },
      }),
      { params: Promise.resolve({ id: documentId }) }
    );
    expect(res.status).toBe(200);

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    expect(doc?.sentViaWhatsAppAt).not.toBeNull();
  });
});

