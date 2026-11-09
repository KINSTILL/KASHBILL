'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { Logo } from '@/components/layout/Logo';
import type { LandingPersonalization } from '@/lib/landing/types';

export function LandingHeader({
  personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const t = useTranslations('landing.nav');

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Logo href={`/${locale}`} />
        </div>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <a href="#features" className="hover:text-ink">{t('features')}</a>
          <a href="#pricing" className="hover:text-ink">{t('pricing')}</a>
          <a href="#demo" className="hover:text-ink">{t('demo')}</a>
          <Link href={`/${locale}/blog` as Route} className="hover:text-ink">Blog</Link>
          <Link href={`/${locale}/faq` as Route} className="hover:text-ink">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Link href={`/${locale}/login` as Route} className="text-sm font-medium text-slate-600 hover:text-ink">
            {t('login')}
          </Link>
          <Link href={`/${locale}/register` as Route}>
            <Button size="sm">{t('try')}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
