'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui/Button';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { user } = useCurrentUser();

  return (
    <header className="header-blur transition-smooth sticky top-0 z-30 border-b border-slate-100">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={`/${locale}` as Route}
          className="group flex items-baseline gap-0.5 font-display text-[18px] font-extrabold tracking-[-0.03em] text-ink"
        >
          mycashbill
          <span className="h-1.5 w-1.5 rounded-full bg-sage-500 transition-smooth group-hover:bg-terracotta" />
        </Link>
        <div className="flex items-center gap-2">
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

