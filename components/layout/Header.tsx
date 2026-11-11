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
import { ShieldCheck, LogOut, LogIn } from 'lucide-react';
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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Logo href={`/${locale}?landing=1`} size="sm" />
          <Link
            href={`/${locale}?landing=1` as Route}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            Site ↗
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Outils Admin et badges secondaires : affichés uniquement sur tablette/desktop (sm+) pour épurer le téléphone */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPPORT') && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link href={`/${locale}/admin` as Route}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-emerald-300 bg-emerald-50 px-2 text-xs font-semibold text-emerald-900 shadow-xs hover:bg-emerald-100"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Admin</span>
                </Button>
              </Link>
              <AdminTestProToggle />
            </div>
          )}

          <div className="hidden sm:block">
            <InstallButton variant="header" />
          </div>

          <div className="hidden sm:block">
            <QuotaBadge />
          </div>

          <Link
            href={`/${locale}/blog` as Route}
            className="hidden rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 sm:inline-block"
          >
            Blog
          </Link>

          {/* Bascule Langue 1-clic sur mobile, [FR|EN] sur desktop */}
          <LocaleSwitcher />

          {/* Déconnexion : icône sobre sur mobile, bouton texte sur desktop */}
          {user && (
            <>
              <button
                type="button"
                onClick={handleLogout}
                aria-label={t('logout')}
                title={t('logout')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <Button
                size="sm"
                variant="ghost"
                className="hidden h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 sm:inline-flex"
                onClick={handleLogout}
              >
                {t('logout')}
              </Button>
            </>
          )}

          {!user && (
            <>
              <Link
                href={`/${locale}/login` as Route}
                aria-label={t('login')}
                title={t('login')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 sm:hidden"
              >
                <LogIn className="h-4 w-4" />
              </Link>
              <Link href={`/${locale}/login` as Route} className="hidden sm:inline-flex">
                <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs">
                  {t('login')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
