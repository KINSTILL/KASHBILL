import { describe, it, expect, beforeEach } from 'vitest';
import { clearDatabase } from '../helpers/db';
import { createTestUser, resetUserCounter } from '../helpers/factories';
import { prisma } from '@/lib/db';
import { signSession } from '@/lib/auth/jwt';
import { issueReauthToken } from '@/lib/admin/reauth';
import { NextRequest } from 'next/server';

import { POST as banRoute } from '@/app/api/admin/users/[id]/ban/route';
import { PATCH as updateThresholdRoute } from '@/app/api/admin/thresholds/[key]/route';
import { POST as confirmFraudRoute } from '@/app/api/admin/fraud/[id]/confirm/route';
import { GET as auditRoute } from '@/app/api/admin/audit/route';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

async function createAuthenticatedAdmin(role: 'ADMIN' | 'SUPPORT' = 'ADMIN') {
  const user = await createTestUser({ role });
  const device = await prisma.device.create({
    data: {
      userId: user.id,
      deviceId: `dev-${user.id}`,
    },
  });
  const cookie = await signSession(
    { sub: user.id, did: device.deviceId, role: user.role },
    '4h'
  );
  return { user, device, cookie };
}

describe('Admin routes', () => {
  it('SUPPORT ne peut pas bannir (403)', async () => {
    const support = await createAuthenticatedAdmin('SUPPORT');
    const target = await createTestUser({ role: 'USER' });

    const req = new NextRequest(`http://localhost/api/admin/users/${target.id}/ban`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'fetch',
        cookie: `cashbill_session=${support.cookie}`,
      },
      body: JSON.stringify({ reason: 'Tentative de ban par support' }),
    });

    const res = await banRoute(req, { params: Promise.resolve({ id: target.id }) });
    expect(res.status).toBe(403);

    const checkUser = await prisma.user.findUnique({ where: { id: target.id } });
    expect(checkUser?.bannedAt).toBeNull();
  });

  it('ADMIN sans token de ré-authentification reçoit 401 REAUTH_REQUIRED', async () => {
    const admin = await createAuthenticatedAdmin('ADMIN');
    const target = await createTestUser({ role: 'USER' });

    const req = new NextRequest(`http://localhost/api/admin/users/${target.id}/ban`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'fetch',
        cookie: `cashbill_session=${admin.cookie}`,
      },
      body: JSON.stringify({ reason: 'Ban sans reauth' }),
    });

    const res = await banRoute(req, { params: Promise.resolve({ id: target.id }) });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error?.code).toBe('REAUTH_REQUIRED');
  });

  it('ADMIN avec ré-authentification peut bannir un USER (200) et trace un audit', async () => {
    const admin = await createAuthenticatedAdmin('ADMIN');
    const target = await createTestUser({ role: 'USER' });
    const reauthToken = await issueReauthToken(admin.user.id);

    const req = new NextRequest(`http://localhost/api/admin/users/${target.id}/ban`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'fetch',
        'x-reauth-token': reauthToken,
        cookie: `cashbill_session=${admin.cookie}`,
      },
      body: JSON.stringify({ reason: 'Utilisateur frauduleux confirmé' }),
    });

    const res = await banRoute(req, { params: Promise.resolve({ id: target.id }) });
    expect(res.status).toBe(200);

    const checkUser = await prisma.user.findUnique({ where: { id: target.id } });
    expect(checkUser?.bannedAt).not.toBeNull();
    expect(checkUser?.banReason).toBe('Utilisateur frauduleux confirmé');

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'admin_user_banned', targetId: target.id },
    });
    expect(audit).not.toBeNull();
    expect(audit?.actorId).toBe(admin.user.id);
  });

  it('Actions SSH only vérifiées : baisser seuil sous plancher -> 403', async () => {
    const admin = await createAuthenticatedAdmin('ADMIN');
    const reauthToken = await issueReauthToken(admin.user.id);

    await prisma.fraudThreshold.create({
      data: {
        key: 'MAX_DOCS_PER_24H',
        value: 50,
        floor: 10,
        ceiling: 100,
        description: 'Nombre maximum de documents par 24h',
      },
    });

    // Tentative de baisser à 5 (sous le plancher de 10)
    const req = new NextRequest('http://localhost/api/admin/thresholds/MAX_DOCS_PER_24H', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'fetch',
        'x-reauth-token': reauthToken,
        cookie: `cashbill_session=${admin.cookie}`,
      },
      body: JSON.stringify({ value: 5, reason: 'Test baisse sous plancher' }),
    });

    const res = await updateThresholdRoute(req, {
      params: Promise.resolve({ key: 'MAX_DOCS_PER_24H' }),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error?.message).toContain('hors bornes');
  });

  it('Fraude confirmée -> blacklist créée et flag CONFIRMED', async () => {
    const admin = await createAuthenticatedAdmin('ADMIN');
    const target = await createTestUser({ role: 'USER' });
    const reauthToken = await issueReauthToken(admin.user.id);

    const flag = await prisma.fraudFlag.create({
      data: {
        userId: target.id,
        reason: 'Duplication suspecte',
        severity: 'HIGH',
        status: 'PENDING',
      },
    });

    const req = new NextRequest(`http://localhost/api/admin/fraud/${flag.id}/confirm`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-requested-with': 'fetch',
        'x-reauth-token': reauthToken,
        cookie: `cashbill_session=${admin.cookie}`,
      },
      body: JSON.stringify({
        reason: 'Fraude avérée sur les devis',
        blacklistPhone: true,
        banUser: true,
      }),
    });

    const res = await confirmFraudRoute(req, {
      params: Promise.resolve({ id: flag.id }),
    });
    expect(res.status).toBe(200);

    // Vérifier Flag
    const updatedFlag = await prisma.fraudFlag.findUnique({ where: { id: flag.id } });
    expect(updatedFlag?.status).toBe('CONFIRMED');

    // Vérifier BlacklistEntry
    const blacklist = await prisma.blacklistEntry.findFirst({
      where: { type: 'PHONE', value: target.phone },
    });
    expect(blacklist).not.toBeNull();
    expect(blacklist?.reason).toBe('Fraude avérée sur les devis');

    // Vérifier User banni
    const bannedUser = await prisma.user.findUnique({ where: { id: target.id } });
    expect(bannedUser?.bannedAt).not.toBeNull();
  });

  it('Audit consultable : GET /api/admin/audit renvoie les entrées tracées', async () => {
    const admin = await createAuthenticatedAdmin('ADMIN');

    await prisma.auditLog.create({
      data: {
        action: 'system_test_event',
        actorId: admin.user.id,
        meta: { test: true },
      },
    });

    const req = new NextRequest('http://localhost/api/admin/audit', {
      method: 'GET',
      headers: { cookie: `cashbill_session=${admin.cookie}` },
    });

    const res = await auditRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(
      data.logs.some((l: { action: string }) => l.action === 'system_test_event')
    ).toBe(true);
  });
});
