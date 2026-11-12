'use client';

import { useEffect, useState } from 'react';
import { PRO_PLANS, planSavings, type ProPlanId } from '@/lib/pricing/plans';
import {
  DISPLAY_CURRENCIES,
  convertFromXaf,
  formatConverted,
  type DisplayCurrency,
  type LiveRates,
} from '@/lib/pricing/currencies';
import { cn } from '@/lib/utils';

const CURRENCY_KEY = 'mycashbill:pricing-currency';

type RatesPayload = { rates: LiveRates | null; updatedAt: string | null; source: string | null };

function formatXaf(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR').format(value)} FCFA`;
}

export function ProPlanPicker({
  locale,
  selected,
  onSelect,
}: {
  locale: string;
  /** Formule sélectionnée (page d'achat). Absent sur la vitrine. */
  selected?: ProPlanId;
  /** Absent = affichage seul (vitrine) : les cartes ne sont pas cliquables. */
  onSelect?: (id: ProPlanId) => void;
}) {
  const isFr = locale !== 'en';
  // null = prix en FCFA uniquement (par défaut)
  const [currencyCode, setCurrencyCode] = useState<DisplayCurrency['code'] | null>(null);
  const [live, setLive] = useState<RatesPayload | null>(null);

  // Mémorise la devise choisie sur cet appareil.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_KEY) as DisplayCurrency['code'] | null;
      if (saved && DISPLAY_CURRENCIES.some((c) => c.code === saved)) setCurrencyCode(saved);
    } catch {}
  }, []);

  // Taux en ligne (approximatifs), une seule requête par visite.
  useEffect(() => {
    fetch('/api/pricing/rates')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: RatesPayload | null) => setLive(d))
      .catch(() => setLive(null));
  }, []);

  const currency: DisplayCurrency | null = DISPLAY_CURRENCIES.find((c) => c.code === currencyCode) ?? null;
  const isApprox = currency?.fixedPerXaf === null;

  // Touche la devise active : la désélectionne (retour au FCFA seul)
  const chooseCurrency = (code: DisplayCurrency['code']) => {
    const next = currencyCode === code ? null : code;
    setCurrencyCode(next);
    try {
      if (next) localStorage.setItem(CURRENCY_KEY, next);
      else localStorage.removeItem(CURRENCY_KEY);
    } catch {}
  };

  const priceLine = (xaf: number) => {
    if (!currency) return null;
    const value = convertFromXaf(xaf, currency, live?.rates ?? null);
    if (value === null) {
      return isFr ? 'Taux indisponible' : 'Rate unavailable';
    }
    return `≈ ${formatConverted(value, currency, locale)}`;
  };

  return (
    <div className="space-y-4">
      {/* Équivalences indicatives : le paiement reste en FCFA */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600">
          {isFr ? 'Voir aussi en' : 'Also show in'}
        </span>
        <div role="group" aria-label={isFr ? 'Devise d’équivalence' : 'Equivalent currency'} className="flex gap-1.5">
          {DISPLAY_CURRENCIES.map((c) => {
            const active = currencyCode === c.code;
            return (
              <button
                key={c.code}
                type="button"
                aria-pressed={active}
                onClick={() => chooseCurrency(c.code)}
                className={cn(
                  'inline-flex min-h-11 min-w-12 items-center justify-center gap-1 rounded-full border px-3 text-sm font-semibold transition',
                  active
                    ? 'border-sage-500 bg-sage-500 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-sage-300 hover:text-slate-900'
                )}
              >
                {c.label}
                <span className="sr-only">{c.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formules */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PRO_PLANS.map((plan) => {
          const savings = planSavings(plan);
          const label = plan.months === 12 ? (isFr ? '1 an' : '1 year') : isFr ? `${plan.months} mois` : `${plan.months} months`;
          const isSelected = selected === plan.id;
          const best = plan.months === 12;

          const Tag = onSelect ? 'button' : 'div';
          const interactive = onSelect
            ? { type: 'button' as const, 'aria-pressed': isSelected, onClick: () => onSelect(plan.id) }
            : {};

          return (
            <Tag
              key={plan.id}
              {...interactive}
              className={cn(
                'relative flex flex-col gap-2 rounded-card border p-4 text-left transition',
                isSelected
                  ? 'border-sage-500 bg-sage-50 shadow-card ring-1 ring-sage-500/40'
                  : best
                    ? 'border-emerald-300 bg-white hover:border-emerald-500 hover:shadow-card-hover'
                    : 'border-slate-200 bg-white hover:border-sage-300 hover:shadow-card-hover'
              )}
            >
              {best && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-xs">
                  {isFr ? 'Le plus avantageux' : 'Best value'}
                </span>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{label}</span>
                {savings.savedPercent > 0 && (
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/70">
                    −{savings.savedPercent}%
                  </span>
                )}
              </div>

              <div>
                <p className="money text-xl font-extrabold text-ink">{formatXaf(plan.priceXaf, locale)}</p>
                {savings.savedXaf > 0 && (
                  <p className="text-xs text-slate-500">
                    <span className="line-through">{formatXaf(savings.withoutDiscountXaf, locale)}</span>
                    {' · '}
                    {isFr
                      ? `vous économisez ${formatXaf(savings.savedXaf, locale)}`
                      : `you save ${formatXaf(savings.savedXaf, locale)}`}
                  </p>
                )}
              </div>

              <div className="mt-auto space-y-0.5">
                <p className="text-xs text-slate-600">
                  {isFr
                    ? `soit ${formatXaf(savings.perMonthXaf, locale)} / mois`
                    : `${formatXaf(savings.perMonthXaf, locale)} / month`}
                </p>
                {priceLine(plan.priceXaf) && (
                  <p className="text-xs font-semibold text-sage-800">{priceLine(plan.priceXaf)}</p>
                )}
              </div>
            </Tag>
          );
        })}
      </div>

      {currency && (
        <p className="text-[11px] leading-relaxed text-slate-500">
          {isApprox
            ? isFr
              ? `Montants approximatifs, donnés à titre indicatif${live?.updatedAt ? ` (taux du ${new Date(live.updatedAt).toLocaleDateString('fr-FR')})` : ''}. Vous payez en FCFA.`
              : `Approximate amounts, for information only${live?.updatedAt ? ` (rate of ${new Date(live.updatedAt).toLocaleDateString('en-US')})` : ''}. You pay in FCFA.`
            : isFr
              ? 'Équivalence indicative à parité fixe. Vous payez en FCFA.'
              : 'Indicative conversion at a fixed rate. You pay in FCFA.'}
          {isApprox && live?.source && (
            <>
              {' '}
              {isFr ? 'Taux fournis par' : 'Rates by'}{' '}
              <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">
                Rates By Exchange Rate API
              </a>
              .
            </>
          )}
        </p>
      )}
    </div>
  );
}
