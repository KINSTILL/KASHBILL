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
    <nav className="bottomnav-floating transition-smooth fixed inset-x-0 bottom-0 z-40 mx-3 mb-3 pb-safe md:hidden">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href as Route}
                className={cn(
                'transition-smooth flex flex-col items-center justify-center rounded-[18px] py-2.5 text-[11px]',
                active ? 'font-bold text-sage-600' : 'text-slate-500 hover:text-slate-700'
                )}
              >
              <span
                className={cn(
                  'mb-0.5 text-lg leading-none transition-smooth',
                  active && 'scale-110'
                )}
              >
                {item.icon}
              </span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

