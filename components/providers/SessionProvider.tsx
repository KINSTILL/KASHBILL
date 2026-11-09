'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Client-side CSRF header auto-injection for mutations
if (typeof window !== 'undefined' && !(window as unknown as { __csrf_patched?: boolean }).__csrf_patched) {
  (window as unknown as { __csrf_patched?: boolean }).__csrf_patched = true;
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (init && init.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method.toUpperCase())) {
      const headers = new Headers(init.headers || {});
      if (!headers.has('X-Requested-With')) {
        headers.set('X-Requested-With', 'fetch');
      }
      init.headers = headers;
    }
    return originalFetch.call(this, input, init);
  };
}

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  businessName: string | null;
  role: 'USER' | 'SUPPORT' | 'ADMIN';
  accountType?: 'PROFESSIONAL' | 'CONSUMER';
  proUntil: string | null;
  referralCode: string;
  country: string;
  mode?: 'ECOMMERCE' | 'PRESTATION';
  city?: string | null;
  taxId?: string | null;
  rccm?: string | null;
  legalAddress?: string | null;
  legalName?: string | null;
  legalForm?: string | null;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  stampUrl?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  cgvText?: string | null;
  createdAt?: string;
} | null;

const Ctx = createContext<{ user: SessionUser; refresh: () => Promise<void> }>({
  user: null,
  refresh: async () => {},
});

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SessionUser>(initialUser);

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
      } else {
        setUser(null);
      }
    } catch {}
  };

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  return <Ctx.Provider value={{ user, refresh }}>{children}</Ctx.Provider>;
}

export function useCurrentUser() {
  return useContext(Ctx);
}
