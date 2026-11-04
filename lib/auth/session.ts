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

export function serializeCookie(
  name: string,
  value: string,
  options: ReturnType<typeof getSessionCookieOptions>
): string {
  let cookie = `${name}=${value}; Path=${options.path}; Max-Age=${options.maxAge}; SameSite=${options.sameSite}`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  return cookie;
}

export async function setSessionCookie(
  userId: string,
  deviceId: string,
  role: Role,
  res?: Response
) {
  const { name, value, options } = await createSessionCookie(userId, deviceId, role);
  if (res) {
    res.headers.set('Set-Cookie', serializeCookie(name, value, options));
  }
  try {
    const store = await cookies();
    store.set(name, value, options);
  } catch {
    // dans un contexte de test sans requestAsyncStorage
  }
}

export async function clearSessionCookie(res?: Response) {
  if (res) {
    res.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`
    );
  }
  try {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  } catch {
    // dans un contexte de test sans requestAsyncStorage
  }
}

export type CurrentUser = { user: User; deviceId: string };

export async function getCurrentUserFromRequest(req: NextRequest): Promise<CurrentUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return resolveUserFromToken(token);
}

export async function getCurrentUser(req?: NextRequest): Promise<CurrentUser | null> {
  if (req) {
    return getCurrentUserFromRequest(req);
  }
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    return resolveUserFromToken(token);
  } catch {
    return null;
  }
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

