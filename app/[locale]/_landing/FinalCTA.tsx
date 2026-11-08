import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';

export function FinalCTA({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const t = useTranslations('landing.finalCta');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-ink px-4 py-20 text-white">
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 md:text-lg">
          {t('subtitle')}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={`/${locale}/register` as Route} className="w-full sm:w-auto">
            <Button size="lg" className="w-full min-w-[220px] sm:w-auto">
              {t('btn_primary')}
            </Button>
          </Link>
          <a href="#demo" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full min-w-[220px] sm:w-auto">
              {t('btn_secondary')}
            </Button>
          </a>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          {t('guarantee')}
        </p>
      </div>
    </section>
  );
}
