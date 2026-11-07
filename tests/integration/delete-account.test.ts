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

function deleteReq(cookie: string, body: Record<string, unknown> = { confirm: true }): NextRequest {
  return new NextRequest('http://localhost/api/auth/me', {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      'x-requested-with': 'fetch',
      cookie: cookie ? `mycashbill_session=${cookie}` : '',
    },
    body: JSON.stringify(body),
  });
}

describe('DELETE /api/auth/me', () => {
  it('exige la confirmation explicite { confirm: true }', async () => {
    const cookie = await registerAndGetCookie('699777771');
    const res = await deleteAccountRoute(deleteReq(cookie, {}));
    expect(res.status).toBe(400);

    const user = await prisma.user.findFirstOrThrow();
    expect(user.bannedAt).toBeNull();
  });

  it('anonymise et archive le compte sans le supprimer physiquement', async () => {
    const cookie = await registerAndGetCookie('699777772');
    const initialUser = await prisma.user.findFirstOrThrow();
    await prisma.client.create({
      data: { name: 'Client test', userId: initialUser.id },
    });

    const res = await deleteAccountRoute(deleteReq(cookie, { confirm: true }));
    expect(res.status).toBe(200);

    // L'utilisateur existe toujours (soft delete / conformité légale)
    expect(await prisma.user.count()).toBe(1);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: initialUser.id } });
    const anonSuffix = initialUser.id.slice(-8);

    expect(updated.phone).toBe(`deleted_${anonSuffix}@deleted.local`);
    expect(updated.referralCode).toBe(`deleted_${anonSuffix}`);
    expect(updated.name).toBe('Compte supprimé');
    expect(updated.bannedAt).not.toBeNull();
    expect(updated.banReason).toBe("Compte supprimé par l'utilisateur");
    expect(updated.taxId).toBeNull();
    expect(updated.rccm).toBeNull();

    // Les données métier sont conservées
    expect(await prisma.client.count()).toBe(1);

    // Les appareils sont révoqués
    const activeDevices = await prisma.device.count({
      where: { userId: initialUser.id, revokedAt: null },
    });
    expect(activeDevices).toBe(0);

    // Codes de récupération et approvals supprimés
    expect(await prisma.recoveryCode.count({ where: { userId: initialUser.id } })).toBe(0);
    expect(await prisma.deviceApproval.count({ where: { userId: initialUser.id } })).toBe(0);

    // Audit log écrit
    const log = await prisma.auditLog.findFirst({
      where: { targetId: initialUser.id, action: 'account_deleted_by_user' },
    });
    expect(log).not.toBeNull();
  });

  it('refuse sans session', async () => {
    const res = await deleteAccountRoute(deleteReq('', { confirm: true }));
    expect(res.status).toBe(401);
  });

  it('refuse la suppression du dernier administrateur actif', async () => {
    const cookie = await registerAndGetCookie('699777773');
    await prisma.user.updateMany({ data: { role: 'ADMIN' } });
    const res = await deleteAccountRoute(deleteReq(cookie, { confirm: true }));
    expect(res.status).toBe(403);

    const user = await prisma.user.findFirstOrThrow();
    expect(user.bannedAt).toBeNull();
  });

  it('autorise la suppression d’un administrateur si un autre admin actif existe', async () => {
    const cookie = await registerAndGetCookie('699777774');
    await prisma.user.updateMany({ data: { role: 'ADMIN' } });

    // Créer un deuxième admin actif
    await prisma.user.create({
      data: {
        phone: '+237699000000',
        pinHash: 'dummy',
        role: 'ADMIN',
        referralCode: 'ADMIN002',
      },
    });

    const res = await deleteAccountRoute(deleteReq(cookie, { confirm: true }));
    expect(res.status).toBe(200);
  });
});

