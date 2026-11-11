'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/device/haptics';
import {
  FilePlus2,
  FileText,
  Users,
  Settings as SettingsIcon,
  LayoutDashboard,
} from 'lucide-react';

export function BottomNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const items = [
    {
      href: `/${locale}/dashboard`,
      label: 'Accueil',
      icon: LayoutDashboard,
      match: (p: string) => p === `/${locale}/dashboard` || p === `/${locale}`,
    },
    {
      href: `/${locale}/documents`,
      label: t('history'),
      icon: FileText,
      match: (p: string) =>
        p === `/${locale}/documents` ||
        (p.startsWith(`/${locale}/documents/`) && !p.includes('/new')),
    },
    {
      href: `/${locale}/documents/new`,
      label: t('new'),
      icon: FilePlus2,
      isPrimary: true,
      match: (p: string) => p === `/${locale}/documents/new`,
    },
    {
      href: `/${locale}/clients`,
      label: t('clients'),
      icon: Users,
      match: (p: string) => p.startsWith(`/${locale}/clients`),
    },
    {
      href: `/${locale}/settings`,
      label: t('profile'),
      icon: SettingsIcon,
      match: (p: string) => p.startsWith(`/${locale}/settings`),
    },
  ];

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-1 md:hidden pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-lg shadow-slate-900/10 backdrop-blur-xl ring-1 ring-black/5">
        <div className="grid grid-cols-5 items-center text-center">
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  onClick={() => haptic('medium')}
                  className="flex flex-col items-center justify-center gap-1 group focus:outline-none"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition-all duration-200 active:scale-95',
                      active
                        ? 'bg-emerald-600 shadow-emerald-600/35 ring-2 ring-emerald-400/30'
                        : 'bg-emerald-600 shadow-emerald-600/25 group-hover:scale-105'
                    )}
                  >
                    <Icon className="h-5 w-5 stroke-[2.4]" />
                  </span>
                  <span
                    className={cn(
                      'leading-none text-[10.5px] font-bold tracking-tight',
                      active ? 'text-emerald-700 font-extrabold' : 'text-slate-700'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href as Route}
                onClick={() => haptic('light')}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-0.5 text-[11px] transition-colors duration-150 active:scale-95 focus:outline-none',
                  active
                    ? 'font-bold text-emerald-600'
                    : 'font-medium text-slate-400 hover:text-slate-700'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    active ? 'stroke-[2.4] text-emerald-600' : 'stroke-[1.8]'
                  )}
                />
                <span className="leading-none tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
