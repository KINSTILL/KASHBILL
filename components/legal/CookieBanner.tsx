'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { CONSENT_COOKIE_NAME, CONSENT_COOKIE_MAX_AGE } from '@/lib/legal/constants';

export function CookieBanner() {
  const t = useTranslations('cookies');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const has = document.cookie.split('; ').some((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`));
    setVisible(!has);
  }, []);

  const accept = (value: 'all' | 'essential') => {
    document.cookie = `${CONSENT_COOKIE_NAME}=${value}; max-age=${CONSENT_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    setVisible(false);
    if (value === 'all' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mycashbill:analytics-consent', { detail: true }));
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white p-4 shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-xl md:border">
      <p className="mb-3 text-[13px] text-slate-700">{t('message')}</p>
      <div className="flex flex-col gap-2">
        <Button size="sm" onClick={() => accept('all')}>{t('acceptAll')}</Button>
        <Button size="sm" variant="ghost" onClick={() => accept('essential')}>{t('essentialOnly')}</Button>
        <Link href="/fr/legal/cookies" className="text-center text-[11px] text-sage-600 underline">{t('learnMore')}</Link>
      </div>
    </div>
  );
}

