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
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5 text-xs">
      <button
        onClick={() => switchTo('fr')}
        className={locale === 'fr' ? 'rounded bg-sage-500 px-2 py-1 text-white' : 'px-2 py-1'}
      >
        FR
      </button>
      <button
        onClick={() => switchTo('en')}
        className={locale === 'en' ? 'rounded bg-sage-500 px-2 py-1 text-white' : 'px-2 py-1'}
      >
        EN
      </button>
    </div>
  );
}

