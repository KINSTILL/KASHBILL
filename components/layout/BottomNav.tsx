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
      match: (p: string) => p === `/${locale}/documents` || (p.startsWith(`/${locale}/documents/`) && !p.includes('/new')),
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
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur-xl ring-1 ring-black/5">
        <div className="grid grid-cols-5 items-center p-1">
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  onClick={() => haptic('medium')}
                  className="flex flex-col items-center justify-center py-1 -my-2 group focus:outline-none"
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-2xl shadow-md transition-all duration-200 active:scale-95',
                      active
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-700/30 ring-2 ring-emerald-400/30'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-emerald-700/25 group-hover:scale-105'
                    )}
                  >
                    <Icon className="h-5 w-5 stroke-[2.4]" />
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 text-[10px] font-bold tracking-tight',
                      active ? 'text-emerald-700 font-extrabold' : 'text-slate-600'
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
                onClick={() => haptic('selection')}
                className={cn(
                  'flex min-h-[46px] flex-col items-center justify-center rounded-xl py-1 text-[11px] transition-all duration-150 active:scale-95 focus:outline-none',
                  active
                    ? 'font-bold text-emerald-700'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <span
                  className={cn(
                    'relative flex h-7 w-7 items-center justify-center rounded-lg transition-transform',
                    active && 'scale-110'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'stroke-[2.4] text-emerald-600' : 'stroke-[1.8] text-slate-500'
                    )}
                  />
                  {active && (
                    <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-emerald-600" />
                  )}
                </span>
                <span className="mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
