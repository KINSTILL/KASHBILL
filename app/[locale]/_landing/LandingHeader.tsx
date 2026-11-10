'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { Logo } from '@/components/layout/Logo';
import type { LandingPersonalization } from '@/lib/landing/types';

export function LandingHeader({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const t = useTranslations('landing.nav');
  const isFr = locale === 'fr';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-3 sm:px-4">
        <div className="flex items-center min-w-0 shrink">
          <Logo href={`/${locale}`} size="sm" hideSubtitleOnMobile />
        </div>

        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-900 transition-colors">{t('features')}</a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">{t('pricing')}</a>
          <a href="#demo" className="hover:text-slate-900 transition-colors">{t('demo')}</a>
          <Link href={`/${locale}/blog` as Route} className="hover:text-slate-900 transition-colors">Blog</Link>
          <Link href={`/${locale}/faq` as Route} className="hover:text-slate-900 transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LocaleSwitcher />
          
          <Link
            href={`/${locale}/login` as Route}
            className="hidden text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 sm:inline-block px-2 py-1"
          >
            {t('login')}
          </Link>

          <Link href={`/${locale}/register` as Route} className="shrink-0">
            <Button
              size="sm"
              className="h-8 px-2.5 sm:px-3 text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs whitespace-nowrap"
            >
              <span className="sm:hidden">{isFr ? 'Essayer gratuit' : 'Try free'}</span>
              <span className="hidden sm:inline">{t('try')}</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
