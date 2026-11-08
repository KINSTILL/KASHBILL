'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { canDo, type AdminAction } from '@/lib/admin/roles';

export function AdminSidebar() {
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useCurrentUser();

  const items: Array<{ href: string; label: string; action: AdminAction }> = [
    { href: `/${locale}/admin`, label: '📊 Dashboard', action: 'view_stats' },
    { href: `/${locale}/admin/users`, label: '👥 Utilisateurs', action: 'view_users' },
    { href: `/${locale}/admin/subscriptions`, label: '💎 Abonnements', action: 'manage_subscriptions' },
    { href: `/${locale}/admin/invoices`, label: '🧾 Factures', action: 'view_invoices' },
    { href: `/${locale}/admin/fraud`, label: '🚨 Fraude', action: 'view_fraud_queue' },
    { href: `/${locale}/admin/blacklist`, label: '⛔ Blacklist', action: 'manage_blacklist' },
    { href: `/${locale}/admin/thresholds`, label: '⚙️ Seuils', action: 'manage_thresholds' },
    { href: `/${locale}/admin/countries`, label: '🌍 Pays', action: 'manage_countries' },
    { href: `/${locale}/admin/audit`, label: '📜 Audit', action: 'view_audit' },
  ];
  if (user?.role === 'ADMIN') {
    items.push({ href: `/${locale}/admin/supports`, label: '👤 SUPPORT', action: 'list_supports' });
  }

  const visibleItems = items.filter((item) => canDo(user?.role ?? 'USER', item.action));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-white md:flex md:flex-col justify-between min-h-screen">
        <div>
          <div className="border-b p-4 flex items-center justify-between">
            <Link href={`/${locale}/admin` as Route} className="text-lg font-bold text-sage-900">
              MyCashBill Admin
            </Link>
            <span className="text-xs px-2 py-0.5 rounded bg-sage-100 text-sage-800 font-semibold">
              {user?.role}
            </span>
          </div>
          <nav className="space-y-1 p-4">
            {visibleItems.map((item) => {
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
        </div>

        <div className="border-t p-4 bg-slate-50">
          <Link
            href={`/${locale}/dashboard` as Route}
            className="flex items-center justify-between rounded-lg border border-sage-200 bg-white px-3 py-2 text-xs font-semibold text-sage-900 shadow-xs hover:bg-sage-100 transition-colors"
          >
            <span>📱 Espace Client (Mode Test)</span>
            <span>→</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="border-b bg-white p-3 md:hidden sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
          <Link href={`/${locale}/admin` as Route} className="font-bold text-sage-900">
            MyCashBill Admin
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/dashboard` as Route}
              className="text-xs px-2.5 py-1 rounded bg-sage-50 text-sage-800 hover:bg-sage-100 font-semibold border border-sage-200"
            >
              📱 App Client
            </Link>
            <span className="text-xs px-2 py-0.5 rounded bg-sage-100 text-sage-800 font-semibold">
              {user?.role}
            </span>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {visibleItems.map((item) => {
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
