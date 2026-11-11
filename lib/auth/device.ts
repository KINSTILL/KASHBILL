import { prisma } from '@/lib/db';
import type { Device, User } from '@prisma/client';

export async function getDeviceLimit(user: { id?: string; proUntil?: Date | null; role?: string }): Promise<number> {
  if (user.role === 'ADMIN' || user.role === 'SUPPORT') {
    return 100;
  }
  const { getDeviceLimitForUser } = await import('@/lib/addons/queries');
  return getDeviceLimitForUser({
    id: user.id ?? '',
    proUntil: user.proUntil ?? null,
  });
}

export async function countActiveDevices(userId: string): Promise<number> {
  return prisma.device.count({ where: { userId, revokedAt: null } });
}

export async function listActiveDevices(userId: string): Promise<Device[]> {
  return prisma.device.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: 'desc' },
  });
}

export type RegisterDeviceResult =
  | { ok: true; device: Device }
  | { ok: false; reason: 'LIMIT_REACHED'; activeDevices: Device[] };

/**
 * Révoque les appareils au-delà de la limite actuelle (ex. après expiration du Pro).
 * L'appareil en cours est conservé en priorité, puis les plus récemment vus.
 */
export async function enforceDeviceLimit(user: User, currentDeviceId: string): Promise<void> {
  const limit = await getDeviceLimit(user);
  const active = await prisma.device.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { lastSeenAt: 'desc' },
  });
  const ordered = [
    ...active.filter((d) => d.deviceId === currentDeviceId),
    ...active.filter((d) => d.deviceId !== currentDeviceId),
  ];
  const toRevoke = ordered.slice(limit).map((d) => d.id);
  if (toRevoke.length > 0) {
    await prisma.device.updateMany({
      where: { id: { in: toRevoke } },
      data: { revokedAt: new Date() },
    });
  }
}

export async function registerDevice(
  user: User,
  deviceId: string,
  userAgent: string | null,
  ip: string | null
): Promise<RegisterDeviceResult> {
  await enforceDeviceLimit(user, deviceId);
  const existing = await prisma.device.findUnique({
    where: { userId_deviceId: { userId: user.id, deviceId } },
  });

  if (existing) {
    const device = await prisma.device.update({
      where: { id: existing.id },
      data: { revokedAt: null, lastSeenAt: new Date(), lastIp: ip, userAgent },
    });
    return { ok: true, device };
  }

  const limit = await getDeviceLimit(user);
  const count = await countActiveDevices(user.id);

  if (count >= limit) {
    const activeDevices = await listActiveDevices(user.id);
    return { ok: false, reason: 'LIMIT_REACHED', activeDevices };
  }

  const device = await prisma.device.create({
    data: { userId: user.id, deviceId, userAgent, lastIp: ip },
  });
  return { ok: true, device };
}

export async function revokeDevice(userId: string, deviceId: string): Promise<boolean> {
  const result = await prisma.device.updateMany({
    where: { userId, deviceId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

export async function revokeAllOtherDevices(
  userId: string,
  keepDeviceId: string
): Promise<number> {
  const result = await prisma.device.updateMany({
    where: { userId, deviceId: { not: keepDeviceId }, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

