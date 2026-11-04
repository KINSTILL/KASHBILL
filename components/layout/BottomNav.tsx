'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const items = [
    { href: `/${locale}/documents/new`, label: t('new'), icon: '📄' },
    { href: `/${locale}/documents`, label: t('history'), icon: '📋' },
    { href: `/${locale}/clients`, label: t('clients'), icon: '👥' },
    { href: `/${locale}/settings`, label: t('profile'), icon: '👤' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-safe md:hidden">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                'flex flex-col items-center justify-center py-2 text-xs',
                active ? 'text-sage-700 font-semibold' : 'text-slate-500'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

