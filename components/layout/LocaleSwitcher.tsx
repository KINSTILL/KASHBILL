'use client';

import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LocaleSwitcher({ fullOnMobile = false }: { fullOnMobile?: boolean }) {
  const locale = useLocale() as 'fr' | 'en';
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (newLocale: 'fr' | 'en') => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 3600}`;
    router.push(segments.join('/') as Route);
  };

  const nextLocale = locale === 'fr' ? 'en' : 'fr';

  return (
    <>
      {!fullOnMobile && (
        <button
          type="button"
          onClick={() => switchTo(nextLocale)}
          aria-label={`Changer la langue (${locale.toUpperCase()} → ${nextLocale.toUpperCase()})`}
          title={`Passer en ${nextLocale.toUpperCase()}`}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-bold uppercase text-slate-700 transition hover:bg-slate-100 active:scale-95 sm:hidden"
        >
          {locale.toUpperCase()}
        </button>
      )}

      <div
        className={`${
          fullOnMobile ? 'inline-flex' : 'hidden sm:inline-flex'
        } items-center gap-0.5 sm:gap-1 rounded-lg border border-slate-200 p-0.5 text-[11px] sm:text-xs bg-white`}
      >
        <button
          type="button"
          onClick={() => switchTo('fr')}
          className={
            locale === 'fr'
              ? 'rounded bg-emerald-600 px-2 py-0.5 sm:px-2 sm:py-1 text-white font-bold'
              : 'px-2 py-0.5 sm:px-2 sm:py-1 text-slate-600 hover:text-slate-900 font-medium'
          }
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => switchTo('en')}
          className={
            locale === 'en'
              ? 'rounded bg-emerald-600 px-2 py-0.5 sm:px-2 sm:py-1 text-white font-bold'
              : 'px-2 py-0.5 sm:px-2 sm:py-1 text-slate-600 hover:text-slate-900 font-medium'
          }
        >
          EN
        </button>
      </div>
    </>
  );
}
