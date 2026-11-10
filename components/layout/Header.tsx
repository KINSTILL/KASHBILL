'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';
import { QuotaBadge } from './QuotaBadge';
import { Logo } from './Logo';
import { InstallButton } from '@/components/pwa/InstallButton';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui/Button';
import { ShieldCheck } from 'lucide-react';
import { AdminTestProToggle } from '@/components/admin/AdminTestProToggle';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { user, refresh } = useCurrentUser();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    await refresh();
    router.push(`/${locale}/login` as Route);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-4">
        <Logo href={`/${locale}`} size="sm" />
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {(user?.role === 'ADMIN' || user?.role === 'SUPPORT') && (
            <>
              <Link href={`/${locale}/admin` as Route}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-emerald-300 bg-emerald-50 px-2 text-xs font-semibold text-emerald-900 shadow-xs hover:bg-emerald-100"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </Link>
              <AdminTestProToggle />
            </>
          )}

          <InstallButton variant="header" />
          
          <QuotaBadge />

          <Link
            href={`/${locale}/blog` as Route}
            className="hidden text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 sm:inline-block rounded-lg px-2 py-1"
          >
            Blog
          </Link>

          <LocaleSwitcher />

          {user && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              {t('logout')}
            </Button>
          )}

          {!user && (
            <Link href={`/${locale}/login` as Route}>
              <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs">
                {t('login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
