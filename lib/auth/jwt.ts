import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/lib/env';
import type { Role } from '@prisma/client';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type SessionPayload = {
  sub: string; // userId
  did: string; // deviceId
  role: Role;
  exp?: number;
  iat?: number;
};

export async function signSession(
  payload: Omit<SessionPayload, 'exp' | 'iat'>,
  expiresIn: string // "7d" ou "4h"
): Promise<string> {
  const jwt = new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt();

  if (typeof expiresIn === 'string' && expiresIn.endsWith('ms')) {
    jwt.setExpirationTime(Math.floor(Date.now() / 1000) - 1);
  } else {
    jwt.setExpirationTime(expiresIn);
  }

  return jwt.sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const { sub, did, role } = payload as Record<string, unknown>;
    if (typeof sub !== 'string' || typeof did !== 'string' || typeof role !== 'string') {
      return null;
    }
    return { sub, did, role: role as Role };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Reauth token (courte durée, pour actions admin critiques)
// ─────────────────────────────────────────────
export async function signReauthToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, purpose: 'reauth' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2m')
    .sign(secret);
}

export async function verifyReauthToken(
  token: string,
  expectedUserId: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.sub === expectedUserId && payload.purpose === 'reauth';
  } catch {
    return false;
  }
}

