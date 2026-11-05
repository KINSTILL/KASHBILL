'use client';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale } from 'next-intl';

type Props = {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  documentsCount: number;
};

export function ClientCard({ id, name, phone, note, documentsCount }: Props) {
  const locale = useLocale();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/${locale}/clients/${id}` as Route}
      className="surface block p-4 transition-smooth hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sage-500 to-sage-600 text-[14px] font-bold text-white">
          {initials || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-ink">{name}</p>
          <p className="truncate text-[12px] text-slate-500">{phone ?? note ?? '—'}</p>
        </div>
        <div className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {documentsCount}
        </div>
      </div>
    </Link>
  );
}

