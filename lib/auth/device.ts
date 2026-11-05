import { prisma } from '@/lib/db';
import {
  MAX_ACTIVE_DEVICES_FREE,
  MAX_ACTIVE_DEVICES_PRO,
} from '@/lib/constants';
import type { Device, User } from '@prisma/client';

export function getDeviceLimit(user: { proUntil?: Date | null; role?: string }): number {
  if (user.role === 'ADMIN' || user.role === 'SUPPORT') {
    return 100;
  }
  const isPro = user.proUntil !== null && user.proUntil !== undefined && user.proUntil > new Date();
  return isPro ? MAX_ACTIVE_DEVICES_PRO : MAX_ACTIVE_DEVICES_FREE;
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

export async function registerDevice(
  user: User,
  deviceId: string,
  userAgent: string | null,
  ip: string | null
): Promise<RegisterDeviceResult> {
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

  const limit = getDeviceLimit(user);
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

