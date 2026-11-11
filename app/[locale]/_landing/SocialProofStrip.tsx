'use client';

import { useEffect, useState } from 'react';

export function SocialProofStrip({ locale = 'fr' }: { locale?: string }) {
  const isFr = locale === 'fr';
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/public/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const total = typeof data.documentsGenerated === 'number' ? data.documentsGenerated : 0;
        setCount(total);
      })
      .catch(() => {
        if (active) setCount(0);
      });

    return () => {
      active = false;
    };
  }, []);

  const trustPillars = [
    {
      icon: '⚖️',
      title: isFr ? 'Conforme OHADA' : 'OHADA Compliant',
      desc: isFr ? 'Valide dans 17 pays africains' : 'Valid across 17 African countries',
    },
    {
      icon: '📲',
      title: isFr ? 'Vos coordonnées' : 'Direct Payment',
      desc: isFr ? 'MoMo, Orange, Wave ou RIB' : 'MoMo, Orange, Wave or Bank',
    },
    {
      icon: '🔒',
      title: isFr ? 'Sécurisé Notch Pay' : 'Notch Pay Certified',
      desc: isFr ? 'Abonnement chiffré sans piège' : 'Encrypted & no forced renewals',
    },
    {
      icon: '🚀',
      title: isFr ? 'Pour entrepreneurs' : 'Built for Business',
      desc: isFr ? 'Artisans, freelances & e-commerce' : 'Artisans, freelancers & commerce',
    },
  ];

  return (
    <section className="border-y border-slate-200/70 bg-slate-50/60 py-5">
      <div className="mx-auto max-w-6xl px-4">
        {/* Compteur réel si count >= 500 */}
        {count !== null && count >= 500 && (
          <div className="mb-4 flex items-center justify-center gap-2 text-center text-xs text-slate-700 sm:text-sm border-b border-slate-200/60 pb-3">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-ink">
              +{count.toLocaleString()} {isFr ? 'documents générés' : 'documents generated'}
            </span>
            <span className="text-slate-500">
              {isFr ? 'par des entrepreneurs à travers l’Afrique' : 'by African business owners'}
            </span>
          </div>
        )}

        {/* 4 piliers d'autorité en bande unifiée épurée (zéro boîte encadrée lourde) */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-3 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-slate-200/80">
          {trustPillars.map((p, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 sm:px-4 first:sm:pl-0 last:sm:pr-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/70 text-base shrink-0">
                {p.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                  {p.title}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug mt-0.5">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}