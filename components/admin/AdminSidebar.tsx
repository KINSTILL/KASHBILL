'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/components/providers/SessionProvider';

export function AdminSidebar() {
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useCurrentUser();

  const items = [
    { href: `/${locale}/admin`, label: '📊 Dashboard', action: 'view_stats' },
    { href: `/${locale}/admin/users`, label: '👥 Utilisateurs', action: 'view_users' },
    { href: `/${locale}/admin/fraud`, label: '🚨 Fraude', action: 'view_fraud_queue' },
    { href: `/${locale}/admin/blacklist`, label: '⛔ Blacklist', action: 'manage_blacklist' },
    { href: `/${locale}/admin/thresholds`, label: '⚙️ Seuils', action: 'manage_thresholds' },
    { href: `/${locale}/admin/countries`, label: '🌍 Pays', action: 'manage_countries' },
    { href: `/${locale}/admin/audit`, label: '📜 Audit', action: 'view_audit' },
  ];
  if (user?.role === 'ADMIN') {
    items.push({ href: `/${locale}/admin/supports`, label: '👤 SUPPORT', action: 'list_supports' });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-white md:block">
        <div className="border-b p-4 flex items-center justify-between">
          <Link href={`/${locale}/admin` as Route} className="text-lg font-bold text-sage-900">
            MyCashBill Admin
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-sage-100 text-sage-800 font-semibold">
            {user?.role}
          </span>
        </div>
        <nav className="space-y-1 p-4">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== `/${locale}/admin` && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-sage-100 font-medium text-sage-900'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="border-b bg-white p-3 md:hidden sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <Link href={`/${locale}/admin` as Route} className="font-bold text-sage-900">
            MyCashBill Admin
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-sage-100 text-sage-800 font-semibold">
            {user?.role}
          </span>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== `/${locale}/admin` && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={cn(
                  'whitespace-nowrap px-2.5 py-1.5 rounded-md text-xs font-medium',
                  active
                    ? 'bg-sage-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
