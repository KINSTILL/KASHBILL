'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';

export function ProGiftBanner({
  endsAtFormatted,
  subId,
}: {
  endsAtFormatted: string;
  subId: string;
}) {
  const t = useTranslations('dashboard.proGift');
  const locale = useLocale();
  const [isDismissed, setIsDismissed] = useState(true); // default true to avoid hydration mismatch

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`kashbill_pro_gift_dismissed_${subId}`);
      setIsDismissed(stored === '1');
    } catch {
      setIsDismissed(false);
    }
  }, [subId]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(`kashbill_pro_gift_dismissed_${subId}`, '1');
    } catch {}
  };

  const handleExpand = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(`kashbill_pro_gift_dismissed_${subId}`);
    } catch {}
  };

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-sage-50 px-3.5 py-2 text-xs text-emerald-950 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">🎁</span>
          <span className="font-medium">
            {t('compactNotice', { date: endsAtFormatted })}
          </span>
        </div>
        <button
          type="button"
          onClick={handleExpand}
          className="ml-2 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          {locale === 'en' ? 'Details →' : 'Détails →'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-amber-50/80 via-emerald-50/60 to-teal-50 p-4 sm:p-5 shadow-sm transition-all">
      {/* Background festive glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-emerald-200/40 blur-2xl" />

      <div className="relative z-10 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-xs">
              🎁
            </span>
            <div>
              <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                {t('tag')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            title={t('dismiss')}
            className="rounded-full p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <span className="text-base font-bold leading-none">✕</span>
          </button>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {t('title')}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {t('message', { date: endsAtFormatted })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-medium text-slate-800">
          <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-xs px-2.5 py-1.5 border border-emerald-100 shadow-2xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>{t('benefit1')}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-xs px-2.5 py-1.5 border border-emerald-100 shadow-2xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>{t('benefit2')}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-xs px-2.5 py-1.5 border border-emerald-100 shadow-2xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>{t('benefit3')}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-xs px-2.5 py-1.5 border border-emerald-100 shadow-2xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>{t('benefit4')}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Link href={`/${locale}/documents/new` as Route} className="inline-block">
            <button
              type="button"
              className="w-full sm:w-auto rounded-xl bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 active:scale-[0.99] transition-all cursor-pointer"
            >
              {t('cta')} →
            </button>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-center sm:text-right text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {t('dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}

