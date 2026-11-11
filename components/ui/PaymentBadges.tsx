'use client';

import { useState } from 'react';
import { ALL_NOTCHPAY_BADGES } from '@/lib/countries/payment-badges';

type Props = {
  countryCode?: string;
  showCards?: boolean;
  size?: 'sm' | 'md';
};

export function PaymentBadges({ size = 'md' }: Props) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const height = size === 'sm' ? 24 : 32;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
      {ALL_NOTCHPAY_BADGES.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center justify-center rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 shadow-2xs"
          title={badge.name}
        >
          {failed[badge.id] ? (
            <span className="text-xs font-semibold text-slate-700" style={{ height }}>
              {badge.name}
            </span>
          ) : (
            <img
              src={badge.logoPath}
              alt={badge.name}
              height={height}
              style={{ height, width: 'auto', maxWidth: 68, objectFit: 'contain' }}
              loading="lazy"
              onError={() => setFailed((f) => ({ ...f, [badge.id]: true }))}
            />
          )}
        </div>
      ))}
    </div>
  );
}
