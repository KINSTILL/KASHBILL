'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import type { LandingPersonalization } from '@/lib/landing/types';

export function LanguageSuggestion({
  personalization,
  currentLocale,
}: {
  personalization: LandingPersonalization;
  currentLocale: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  const shouldSuggestEn = currentLocale === 'fr' && personalization.suggestEnglish;
  const shouldSuggestFr = currentLocale === 'en' && personalization.suggestFrench;

  if (dismissed || (!shouldSuggestEn && !shouldSuggestFr)) {
    return null;
  }

  const targetLocale = shouldSuggestEn ? 'en' : 'fr';
  const targetLabel = shouldSuggestEn ? 'Switch to English' : 'Passer en français';
  const message = shouldSuggestEn
    ? 'Prefer English? Switch language for an experience tailored to your region.'
    : 'Préférez-vous le français ? Consultez la version adaptée à votre région.';

  return (
    <div className="relative z-40 bg-emerald-900 px-4 py-2 text-xs text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>{shouldSuggestEn ? '🇬🇧' : '🇫🇷'}</span>
          <span>{message}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${targetLocale}` as Route}
            className="rounded bg-white/20 px-2.5 py-1 font-semibold text-white transition hover:bg-white/30"
          >
            {targetLabel}
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
