'use client';

import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (newLocale: 'fr' | 'en') => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 3600}`;
    router.push(segments.join('/') as Route);
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 rounded-lg border border-slate-200 p-0.5 text-[11px] sm:text-xs bg-white">
      <button
        onClick={() => switchTo('fr')}
        className={
          locale === 'fr'
            ? 'rounded bg-emerald-600 px-1.5 py-0.5 sm:px-2 sm:py-1 text-white font-bold'
            : 'px-1.5 py-0.5 sm:px-2 sm:py-1 text-slate-600 hover:text-slate-900 font-medium'
        }
      >
        FR
      </button>
      <button
        onClick={() => switchTo('en')}
        className={
          locale === 'en'
            ? 'rounded bg-emerald-600 px-1.5 py-0.5 sm:px-2 sm:py-1 text-white font-bold'
            : 'px-1.5 py-0.5 sm:px-2 sm:py-1 text-slate-600 hover:text-slate-900 font-medium'
        }
      >
        EN
      </button>
    </div>
  );
}

