'use client';

import { useOnlineStatus } from '@/lib/device/network';
import { useTranslations } from 'next-intl';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const t = useTranslations('pwa');

  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-orangeMoney px-4 py-2 text-center text-sm font-medium text-white">
      {t('offline')}
    </div>
  );
}

