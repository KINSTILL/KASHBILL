'use client';

import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

/**
 * Toggle bilingue unifié FR / EN.
 * Bascule de langue sans rechargement complet, en préservant le chemin courant
 * et en mémorisant le choix via le cookie NEXT_LOCALE.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (newLocale: 'fr' | 'en') => {
    if (newLocale === locale) return;
    const segments = pathname.split('/');
    segments[1] = newLocale;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 3600}`;
    router.push(segments.join('/') as Route);
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className={
        'inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-sm ' +
        (className ?? '')
      }
    >
      <button
        type="button"
        onClick={() => switchTo('fr')}
        aria-pressed={locale === 'fr'}
        className={
          'rounded-md px-2.5 py-1 transition-colors ' +
          (locale === 'fr'
            ? 'bg-sage-600 text-white'
            : 'text-slate-500 hover:text-slate-900')
        }
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => switchTo('en')}
        aria-pressed={locale === 'en'}
        className={
          'rounded-md px-2.5 py-1 transition-colors ' +
          (locale === 'en'
            ? 'bg-sage-600 text-white'
            : 'text-slate-500 hover:text-slate-900')
        }
      >
        EN
      </button>
    </div>
  );
}
