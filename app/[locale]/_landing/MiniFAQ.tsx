'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';

export function MiniFAQ({ locale }: { locale: string }) {
  const t = useTranslations('landing.faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="bg-white px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-10 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between gap-4 text-left font-semibold text-ink"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base">{item.q}</span>
                  <span
                    className={`text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/faq` as Route}
            className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {t('view_all')}
          </Link>
        </div>
      </div>
    </section>
  );
}
