'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from './Button';

export function UpgradeCTA({
  message,
  reason,
}: {
  message?: string;
  reason?: string;
}) {
  const t = useTranslations('pro');
  const locale = useLocale();

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3" data-reason={reason}>
      <p className="mb-2 text-sm text-amber-900">{message ?? t('locked')}</p>
      <div className="flex gap-2">
        <Link href={`/${locale}/upgrade` as Route}>
          <Button size="sm">{t('upgradeNow')}</Button>
        </Link>
        <Link href={`/${locale}/referrals` as Route}>
          <Button size="sm" variant="ghost">
            {t('referFriend')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
