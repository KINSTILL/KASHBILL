'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import type { LandingPersonalization } from '@/lib/landing/types';

export function StickyCTA({
  personalization: _personalization,
  locale,
}: {
  personalization: LandingPersonalization | { pricing: { proPriceLocalLabel: string; proPriceFallbackLabel: string } };
  locale: string;
}) {
  const [visible, setVisible] = useState(false);
  const isFr = locale === 'fr';

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const bottom = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > 600 && y < bottom - 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <p className="flex-1 text-xs text-slate-600">
          {isFr ? '30 jours Pro offerts' : '30-day Pro trial'}
        </p>
        <Link href={`/${locale}/register` as Route}>
          <Button size="sm">{isFr ? 'Commencer' : 'Start'}</Button>
        </Link>
      </div>
    </div>
  );
}
