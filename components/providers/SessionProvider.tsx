'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  businessName: string | null;
  role: 'USER' | 'SUPPORT' | 'ADMIN';
  proUntil: string | null;
  referralCode: string;
  country: string;
  mode?: 'ECOMMERCE' | 'PRESTATION';
  city?: string | null;
  taxId?: string | null;
  rccm?: string | null;
  legalAddress?: string | null;
  legalName?: string | null;
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
