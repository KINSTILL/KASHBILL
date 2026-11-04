'use client';

let cachedReauthToken: string | null = null;
let cachedExpiry = 0;

export function setReauthToken(token: string, expiresInSeconds: number): void {
  cachedReauthToken = token;
  cachedExpiry = Date.now() + expiresInSeconds * 1000 - 5000;
}

export function getReauthToken(): string | null {
  if (cachedReauthToken && Date.now() < cachedExpiry) return cachedReauthToken;
  cachedReauthToken = null;
  return null;
}

export function clearReauthToken(): void {
  cachedReauthToken = null;
  cachedExpiry = 0;
}

export type AdminFetchOptions = RequestInit & { body?: unknown };

export type AdminFetchResult =
  | { ok: true; data: unknown }
  | { ok: false; reason: 'REAUTH_REQUIRED' | 'FORBIDDEN' | 'ERROR'; error?: unknown };

/**
 * Fetch wrapper qui :
 * 1. Tente la requête avec le header X-Reauth-Token (si dispo)
 * 2. Si 401 REAUTH_REQUIRED → retourne reason='REAUTH_REQUIRED' (le caller ouvre le modal)
 * 3. Sinon traite la réponse normalement
 */
export async function adminFetch(url: string, options: AdminFetchOptions = {}): Promise<AdminFetchResult> {
  const token = getReauthToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Requested-With', 'fetch');
  if (token) headers.set('X-Reauth-Token', token);

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : (options.body as BodyInit | null | undefined),
  });

  if (res.status === 401) {
    const json = await res.json().catch(() => ({}));
    if (json?.error?.code === 'REAUTH_REQUIRED') {
      clearReauthToken();
      return { ok: false, reason: 'REAUTH_REQUIRED' };
    }
    return { ok: false, reason: 'FORBIDDEN' };
  }

  if (res.status === 403) {
    return { ok: false, reason: 'FORBIDDEN' };
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return { ok: false, reason: 'ERROR', error };
  }

  const data = await res.json().catch(() => ({}));
  return { ok: true, data };
}

