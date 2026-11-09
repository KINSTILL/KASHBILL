'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';
import { QuotaBadge } from './QuotaBadge';
import { Logo } from './Logo';
import { InstallButton } from '@/components/pwa/InstallButton';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui/Button';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { user } = useCurrentUser();

  return (
    <header className="bg-white/80 backdrop-blur-md transition-smooth sticky top-0 z-30 border-b border-slate-200/70">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
        <Logo href={`/${locale}`} />
        <div className="flex items-center gap-2">
          {(user?.role === 'ADMIN' || user?.role === 'SUPPORT') && (
            <Link href={`/${locale}/admin` as Route}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-sage-300 bg-sage-50 text-xs font-semibold text-sage-900 shadow-xs hover:bg-sage-100"
              >
                <span>🛡️</span>
                <span className="hidden sm:inline">Console Admin</span>
              </Button>
            </Link>
          )}
          <InstallButton variant="header" />
          <QuotaBadge />
          <Link
            href={`/${locale}/blog` as Route}
            className="text-xs font-semibold text-slate-600 hover:text-sage-700 px-2 py-1 rounded hover:bg-slate-50 transition"
          >
            Blog
          </Link>
          <LocaleSwitcher />
          {!user && (
            <Link href={`/${locale}/login` as Route}>
              <Button size="sm" variant="ghost">
                {t('login')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

