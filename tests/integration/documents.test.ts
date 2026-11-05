import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { POST as createDocRoute } from '@/app/api/documents/route';
import { POST as markSentRoute } from '@/app/api/documents/[id]/mark-sent/route';
import { DELETE as deleteDocRoute } from '@/app/api/documents/[id]/route';
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
  const data = await res.json();
  await prisma.user.update({
    where: { id: data.user.id },
    data: { taxId: 'M012345678900A', rccm: 'RC/DLA/2026/B/1234' },
  });
  return res.headers.get('set-cookie')?.match(/mycashbill_session=([^;]+)/)?.[1] ?? '';
}

const basePayload = {
  type: 'FACTURE' as const,
  locale: 'FR' as const,
  payload: {
    lines: [{ description: 'Service', quantity: 1, unitPrice: 50000 }],
    vatRate: 19.25,
    depositPercentage: null,
    deliveryFee: null,
    notes: null,
    validityDays: null,
  },
};

describe('POST /api/documents', () => {
  it('crée un document avec numérotation atomique et hash', async () => {
    const cookie = await registerAndGetCookie('699333333');
    const res = await createDocRoute(new NextRequest('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `mycashbill_session=${cookie}` },
      body: JSON.stringify(basePayload),
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.number).toMatch(/^MCB-F-\d{4}-\d{6}$/);
    expect(json.publicToken).toBeDefined();

    const doc = await prisma.document.findUnique({ where: { id: json.documentId } });
    expect(doc?.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('génère des numéros séquentiels', async () => {
    const cookie = await registerAndGetCookie('699444444');
    const makeReq = () => new NextRequest('http://localhost/api/documents', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `mycashbill_session=${cookie}` },
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
      headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', cookie: `mycashbill_session=${cookie}` },
      body: JSON.stringify(basePayload),
    }));
    const { documentId } = await createRes.json();

    const res = await markSentRoute(
      new NextRequest(`http://localhost/api/documents/${documentId}/mark-sent`, {
        method: 'POST',
        headers: { 'x-requested-with': 'fetch', cookie: `mycashbill_session=${cookie}` },
      }),
      { params: Promise.resolve({ id: documentId }) }
    );
    expect(res.status).toBe(200);

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    expect(doc?.sentViaWhatsAppAt).not.toBeNull();
  });
});


describe('DELETE /api/documents/:id', () => {
  async function createDoc(cookie: string): Promise<string> {
    const res = await createDocRoute(
      new NextRequest('http://localhost/api/documents', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-requested-with': 'fetch',
          cookie: `mycashbill_session=${cookie}`,
        },
        body: JSON.stringify(basePayload),
      })
    );
    const data = await res.json();
    return data.documentId as string;
  }

  it('supprime un document appartenant a son proprietaire', async () => {
    const cookie = await registerAndGetCookie('699666666');
    const documentId = await createDoc(cookie);

    const res = await deleteDocRoute(
      new NextRequest(`http://localhost/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'x-requested-with': 'fetch', cookie: `mycashbill_session=${cookie}` },
      }),
      { params: Promise.resolve({ id: documentId }) }
    );
    expect(res.status).toBe(200);

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    expect(doc).toBeNull();
  });

  it('retourne 404 si le document est introuvable', async () => {
    const cookie = await registerAndGetCookie('699666667');
    const res = await deleteDocRoute(
      new NextRequest('http://localhost/api/documents/inexistant', {
        method: 'DELETE',
        headers: { 'x-requested-with': 'fetch', cookie: `mycashbill_session=${cookie}` },
      }),
      { params: Promise.resolve({ id: 'inexistant' }) }
    );
    expect(res.status).toBe(404);
  });

  it("refuse la suppression d'un document d'autrui", async () => {
    const ownerCookie = await registerAndGetCookie('699666668');
    const documentId = await createDoc(ownerCookie);

    const otherCookie = await registerAndGetCookie('699666669');
    const res = await deleteDocRoute(
      new NextRequest(`http://localhost/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'x-requested-with': 'fetch', cookie: `mycashbill_session=${otherCookie}` },
      }),
      { params: Promise.resolve({ id: documentId }) }
    );
    expect(res.status).toBe(404);

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    expect(doc).not.toBeNull();
  });
});
