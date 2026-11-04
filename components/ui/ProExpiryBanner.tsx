'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export function ProExpiryBanner({ daysLeft }: { daysLeft: number | null }) {
  const t = useTranslations('pro');
  const locale = useLocale();

  if (daysLeft === null) return null;

  const msg =
    daysLeft <= 0
      ? t('expired')
      : daysLeft === 1
        ? t('expiryToday')
        : t('expirySoon', { days: daysLeft });

  return (
    <Link
      href={`/${locale}/upgrade` as Route}
      className="block rounded-lg bg-amber-100 p-3 text-center text-sm font-medium text-amber-900"
    >
      {msg}
    </Link>
  );
}
