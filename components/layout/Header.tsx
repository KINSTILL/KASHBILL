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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={`/${locale}` as Route} className="text-lg font-bold text-slate-900">
          MyCashBill
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

