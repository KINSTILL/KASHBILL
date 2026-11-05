import { describe, it, expect } from 'vitest';
import {
  signSession,
  verifySession,
  signReauthToken,
  verifyReauthToken,
} from '@/lib/auth/jwt';
import { createSessionCookie, getSessionCookieOptions } from '@/lib/auth/session';

describe('signSession / verifySession', () => {
  it('signe et vérifie un payload valide', async () => {
    const token = await signSession(
      { sub: 'user_123', did: 'device_456', role: 'USER' },
      '7d'
    );
    const payload = await verifySession(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user_123');
    expect(payload!.did).toBe('device_456');
    expect(payload!.role).toBe('USER');
  });

  it('retourne null pour un token invalide', async () => {
    expect(await verifySession('not-a-token')).toBeNull();
  });

  it('retourne null pour un token falsifié', async () => {
    const token = await signSession(
      { sub: 'user_123', did: 'device_456', role: 'USER' },
      '7d'
    );
    const tampered = token.slice(0, -5) + 'AAAAA';
    expect(await verifySession(tampered)).toBeNull();
  });

  it('retourne null pour un token expiré', async () => {
    const token = await signSession(
      { sub: 'user_123', did: 'device_456', role: 'USER' },
      '1ms'
    );
    await new Promise((r) => setTimeout(r, 100));
    expect(await verifySession(token)).toBeNull();
  });
});

describe('signReauthToken / verifyReauthToken', () => {
  it('valide le bon userId', async () => {
    const token = await signReauthToken('user_123');
    expect(await verifyReauthToken(token, 'user_123')).toBe(true);
  });

  it('rejette un userId différent', async () => {
    const token = await signReauthToken('user_123');
    expect(await verifyReauthToken(token, 'other_user')).toBe(false);
  });

  it('rejette un token de session normal (pas de purpose reauth)', async () => {
    const sessionToken = await signSession(
      { sub: 'user_123', did: 'device_456', role: 'USER' },
      '7d'
    );
    expect(await verifyReauthToken(sessionToken, 'user_123')).toBe(false);
  });

  it('rejette un token absent', async () => {
    expect(await verifyReauthToken('', 'user_123')).toBe(false);
  });
});

describe('session cookies', () => {
  it('génère des options de cookie pour jours et heures', () => {
    const optDays = getSessionCookieOptions('7d');
    expect(optDays.maxAge).toBe(7 * 24 * 3600);
    expect(optDays.httpOnly).toBe(true);

    const optHours = getSessionCookieOptions('4h');
    expect(optHours.maxAge).toBe(4 * 3600);

    const optDefault = getSessionCookieOptions('other');
    expect(optDefault.maxAge).toBe(3600);
  });

  it('crée un cookie de session pour user et admin', async () => {
    const userCookie = await createSessionCookie('u1', 'd1', 'USER');
    expect(userCookie.name).toBe('mycashbill_session');
    expect(userCookie.value).toBeTruthy();

    const adminCookie = await createSessionCookie('u2', 'd2', 'ADMIN');
    expect(adminCookie.options.maxAge).toBe(4 * 3600);
  });
});
