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
    <section className="border-y border-slate-200/80 bg-white py-4 shadow-xs">
      <div className="mx-auto max-w-5xl px-4">
        {/* Compteur réel si count >= 500 */}
        {count !== null && count >= 500 && (
          <div className="mb-3 flex items-center justify-center gap-2 text-center text-xs text-slate-700 sm:text-sm border-b border-slate-100 pb-2.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-ink">
              +{count.toLocaleString()} {isFr ? 'documents générés' : 'documents generated'}
            </span>
            <span className="text-slate-500">
              {isFr ? 'par des entrepreneurs à travers l’Afrique' : 'by African business owners'}
            </span>
          </div>
        )}

        {/* 4 piliers d'autorité et réassurance institutionnelle */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
          {trustPillars.map((p, idx) => (
            <div
              key={idx}
              className="flex flex-col items-start gap-1.5 sm:gap-2 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-50 text-base sm:text-lg shrink-0">
                {p.icon}
              </div>
              <div className="w-full">
                <p className="text-xs sm:text-sm font-bold text-slate-950 leading-snug">
                  {p.title}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-600 leading-snug mt-0.5 font-normal">
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