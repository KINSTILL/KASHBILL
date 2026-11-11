'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { Logo } from '@/components/layout/Logo';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import type { LandingPersonalization } from '@/lib/landing/types';

export function LandingHeader({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const t = useTranslations('landing.nav');
  const { user } = useCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-3 sm:px-4">
        <div className="flex items-center shrink-0">
          <Logo href={`/${locale}?landing=1`} size="sm" hideSubtitleOnMobile />
        </div>

        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-900 transition-colors">{t('features')}</a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">{t('pricing')}</a>
          <a href="#demo" className="hover:text-slate-900 transition-colors">{t('demo')}</a>
          <Link href={`/${locale}/blog` as Route} className="hover:text-slate-900 transition-colors">Blog</Link>
          <Link href={`/${locale}/faq` as Route} className="hover:text-slate-900 transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <LocaleSwitcher />

          {user ? (
            <Link
              href={`/${locale}/dashboard` as Route}
              className="inline-flex h-8 items-center rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 whitespace-nowrap"
            >
              {locale === 'en' ? 'My workspace →' : 'Mon espace →'}
            </Link>
          ) : (
            <Link
              href={`/${locale}/login` as Route}
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 px-2 py-1 transition-colors whitespace-nowrap"
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
