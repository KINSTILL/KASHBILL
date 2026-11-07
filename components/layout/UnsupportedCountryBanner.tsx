'use client';

import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isSupportedPaymentCountry } from '@/lib/countries/mobile-money';
import { useState } from 'react';

const DISMISS_KEY = 'mycashbill:unsupported-country-dismissed';

export function UnsupportedCountryBanner() {
  const { user } = useCurrentUser();
  const t = useTranslations('unsupportedCountry');
  const [dismissed, setDismissed] = useState(
    typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'
  );

  if (!user || dismissed) return null;
  if (isSupportedPaymentCountry(user.country)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setDismissed(true);
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-amber-900">{t('title')}</p>
          <p className="mt-1 text-[11px] text-amber-800">{t('message')}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-amber-700 hover:text-amber-900"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

