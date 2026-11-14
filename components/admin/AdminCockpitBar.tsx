'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { AdminTestProToggle } from '@/components/admin/AdminTestProToggle';
import { WhatsAppRefreshButton } from '@/components/admin/WhatsAppRefreshButton';
import { ShieldCheck, ArrowRightLeft, LayoutDashboard, ExternalLink } from 'lucide-react';

export function AdminCockpitBar() {
  const { user } = useCurrentUser();
  const locale = useLocale();
  const pathname = usePathname();

  // Afficher uniquement si l'utilisateur est ADMIN ou SUPPORT
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPPORT')) {
    return null;
  }

  const isAdminSection = pathname.includes('/admin');

  return (
    <div
      role="region"
      aria-label="Cockpit d'administration"
      className="sticky top-0 z-40 border-b border-amber-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white shadow-md backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-1.5 sm:px-4">
        {/* Côté gauche : Identité Admin & Rôle */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-500/30">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="tracking-wide uppercase">Admin</span>
          </span>

          <span className="hidden sm:inline-block text-xs font-semibold text-slate-300">
            {user.role} · Pilotage & Tests
          </span>
        </div>

        {/* Côté droit / Actions rapides : Bascule Pro/Gratuit + Refresh WhatsApp + Switch Espace */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto py-0.5">
          {/* Bascule Formule Test (Pro / Gratuit) */}
          <div className="shrink-0">
            <AdminTestProToggle />
          </div>

          {/* Bouton d'actualisation WhatsApp Evolution (pour accepter les nouveaux numéros) */}
          <div className="shrink-0">
            <WhatsAppRefreshButton variant="pill" showLabel={true} />
          </div>

          {/* Navigation bascule rapide : Console Admin <-> Espace Client */}
          {isAdminSection ? (
            <Link
              href={`/${locale}/dashboard` as Route}
              title="Basculer vers l'interface client pour tester en conditions réelles"
              className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/30 shrink-0"
            >
              <ArrowRightLeft className="h-3 w-3" />
              <span className="whitespace-nowrap">App Client</span>
            </Link>
          ) : (
            <Link
              href={`/${locale}/admin` as Route}
              title="Accéder au Cockpit d'administration complet"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-white/20 shrink-0"
            >
              <LayoutDashboard className="h-3 w-3 text-amber-300" />
              <span className="whitespace-nowrap">Console</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
