'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
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
          <Link href={`/${locale}` as Route} className="font-display text-lg font-extrabold tracking-tight text-ink">
            mycashbill<span className="text-sage-500">.</span>
          </Link>
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
          {personalization.isReturning && (
            <Link href={`/${locale}/login` as Route} className="hidden text-sm text-slate-600 hover:text-ink md:block">
              {t('login')}
            </Link>
          )}
          <Link href={`/${locale}/register` as Route}>
            <Button size="sm">{t('try')}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
