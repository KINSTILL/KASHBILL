import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import type { Role, User } from '@prisma/client';
import { signSession, verifySession, type SessionPayload } from './jwt';
import {
  JWT_EXPIRES_DAYS_USER,
  JWT_EXPIRES_HOURS_ADMIN,
  SESSION_COOKIE,
} from '@/lib/constants';
import { env } from '@/lib/env';

export function getSessionCookieOptions(expiresIn: string) {
  const isProd = env.NODE_ENV === 'production';
  const maxAge = expiresIn.endsWith('d')
    ? parseInt(expiresIn) * 24 * 60 * 60
    : expiresIn.endsWith('h')
    ? parseInt(expiresIn) * 60 * 60
    : 60 * 60;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function createSessionCookie(
  userId: string,
  deviceId: string,
  role: Role
): Promise<{ name: string; value: string; options: ReturnType<typeof getSessionCookieOptions> }> {
  const isAdmin = role === 'ADMIN' || role === 'SUPPORT';
  const expiresIn = isAdmin ? `${JWT_EXPIRES_HOURS_ADMIN}h` : `${JWT_EXPIRES_DAYS_USER}d`;
  const token = await signSession({ sub: userId, did: deviceId, role }, expiresIn);
  return {
    name: SESSION_COOKIE,
    value: token,
    options: getSessionCookieOptions(expiresIn),
  };
}

export async function setSessionCookie(userId: string, deviceId: string, role: Role) {
  const { name, value, options } = await createSessionCookie(userId, deviceId, role);
  const store = await cookies();
  store.set(name, value, options);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type CurrentUser = { user: User; deviceId: string };

export async function getCurrentUserFromRequest(req: NextRequest): Promise<CurrentUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return resolveUserFromToken(token);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return resolveUserFromToken(token);
}

async function resolveUserFromToken(token?: string): Promise<CurrentUser | null> {
  if (!token) return null;
  const payload: SessionPayload | null = await verifySession(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;
  if (user.bannedAt) return null;

  // Vérifie que le device n'est pas révoqué
  const device = await prisma.device.findFirst({
    where: { userId: user.id, deviceId: payload.did, revokedAt: null },
  });
  if (!device) return null;

  return { user, deviceId: payload.did };
}

