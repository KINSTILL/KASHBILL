'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const items = [
    { href: `/${locale}/documents/new`, label: t('new') },
    { href: `/${locale}/documents`, label: t('history') },
    { href: `/${locale}/clients`, label: t('clients') },
    { href: `/${locale}/settings`, label: t('profile') },
  ];

  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
      <nav className="space-y-1 p-4">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm',
                active ? 'bg-sage-100 text-sage-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

