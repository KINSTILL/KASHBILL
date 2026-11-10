import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import type { LandingPersonalization } from '@/lib/landing/types';
import { TIER1_CONFIG } from '@/lib/landing/data';
import { LEGAL_TITLES } from '@/lib/legal/loader';

export function LandingFooter({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization;
  locale: string;
}) {
  const t = useTranslations('landing.footer');
  const year = new Date().getFullYear();

  const tier1Countries = Object.values(TIER1_CONFIG).map((cfg) => cfg.country);

  return (
    <footer className="border-t border-slate-200 bg-white pt-16 pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-3">
            <Logo href={`/${locale}`} />
            <p className="text-sm font-semibold text-emerald-800">
              {t('tagline')}
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              {t('desc')}
            </p>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('col_product')}
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>
                <a href="#features" className="hover:text-ink">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-ink">
                  Tarifs
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-ink">
                  Démo en ligne
                </a>
              </li>
              <li>
                <Link href={`/${locale}/blog` as Route} className="hover:text-ink">
                  Blog
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq` as Route} className="hover:text-ink">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('col_legal')}
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>
                <Link
                  href={`/${locale}/legal/mentions-legales` as Route}
                  className="hover:text-ink"
                >
                  {LEGAL_TITLES['mentions-legales']}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Tier 1 Countries */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('col_countries')}
            </h4>
            <ul className="mt-4 grid grid-cols-1 gap-1.5 text-xs text-slate-600">
              {tier1Countries.map((c) => (
                <li key={c.code} className="flex items-center gap-2">
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="text-[10px] text-slate-400">({c.currency})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
          <p>© {year} MyCashBill. {t('rights')}</p>
        </div>
      </div>
    </footer>
  );
}
