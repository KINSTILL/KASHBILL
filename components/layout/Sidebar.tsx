'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { InstallButton } from '@/components/pwa/InstallButton';

export function Sidebar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPPORT';

  const items = [
    { href: `/${locale}/documents/new`, label: t('new') },
    { href: `/${locale}/documents`, label: t('history') },
    { href: `/${locale}/clients`, label: t('clients') },
    { href: `/${locale}/recurring`, label: t('recurring') },
    { href: `/${locale}/settings`, label: t('settings') },
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
              aria-current={active ? 'page' : undefined}
              className={cn(
                'block rounded-lg border-l-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-sage-600 bg-sage-100 font-semibold text-sage-900'
                  : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-slate-200">
            <Link
              href={`/${locale}/admin` as Route}
              className="flex items-center justify-between rounded-lg border border-sage-200 bg-sage-50 px-3 py-2 text-xs font-semibold text-sage-900 transition-colors hover:bg-sage-100"
            >
              <span>🛡️ Console Admin</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
          <Link
            href={`/${locale}?landing=1` as Route}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-700"
          >
            <span>🌐 Site vitrine</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <InstallButton variant="sidebar" />
        </div>
      </nav>
    </aside>
  );
}
