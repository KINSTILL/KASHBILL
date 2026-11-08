'use client';

import { useEffect, useState } from 'react';

export function SocialProofStrip() {
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

  // Anti-fake strict : affiche UNIQUEMENT si count >= 500
  if (count === null || count < 500) {
    return null;
  }

  return (
    <section className="border-y border-slate-100 bg-white py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 text-center text-xs text-slate-600 sm:text-sm">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold text-ink">
          +{count.toLocaleString()} factures et devis générés
        </span>
        <span>par des entrepreneurs à travers l&apos;Afrique</span>
      </div>
    </section>
  );
}
