'use client';
import { useState } from 'react';
import { getBadgesForCountry, getCardBadges } from '@/lib/countries/payment-badges';

type Props = {
  countryCode: string;
  showCards?: boolean;
  size?: 'sm' | 'md';
};

export function PaymentBadges({ countryCode, showCards = true, size = 'md' }: Props) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const mobileBadges = getBadgesForCountry(countryCode);
  const cardBadges = showCards ? getCardBadges() : [];
  const all = [...mobileBadges, ...cardBadges];

  if (all.length === 0) return null;

  const height = size === 'sm' ? 20 : 28;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {all.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center justify-center rounded-md border border-slate-100 bg-white px-2 py-1"
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
              style={{ height, width: 'auto' }}
              loading="lazy"
              onError={() => setFailed((f) => ({ ...f, [badge.id]: true }))}
            />
          )}
        </div>
      ))}
    </div>
  );
}
