import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { isPro } from '@/lib/auth/plan';
import { FREE_CLIENTS_LIMIT } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { UpgradeCTA } from '@/components/ui/UpgradeCTA';
import { Plus, User, Phone, FileText, ChevronRight } from 'lucide-react';

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const current = await getCurrentUser();

  if (!current) {
    redirect(`/${locale}/login` as Route);
  }

  const { user } = current;
  const _t = await getTranslations();
  const pro = isPro(user);

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { documents: true } } },
  });

  const limitReached = !pro && clients.length >= FREE_CLIENTS_LIMIT;

  return (
    <div className="space-y-5">
      {/* En-tête sans overflow */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            Clients
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {clients.length} {clients.length > 1 ? 'clients enregistrés' : 'client'}
          </p>
        </div>
        {!limitReached && (
          <Link href={`/${locale}/clients/new` as Route} className="shrink-0">
            <Button size="md" className="gap-1.5 font-bold shadow-md shadow-emerald-900/10">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nouveau client</span>
            </Button>
          </Link>
        )}
      </div>

      {limitReached && <UpgradeCTA reason="unlimitedClients" />}

      {clients.length === 0 ? (
        <EmptyState
          title="Aucun client enregistré"
          description="Enregistrez vos clients pour pré-remplir vos devis et factures en un clic."
          action={
            <Link href={`/${locale}/clients/new` as Route}>
              <Button variant="primary">Ajouter mon premier client</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* VUE MOBILE (Cartes tactiles sans scroll horizontal) */}
          <div className="space-y-2.5 sm:hidden">
            {clients.map((client) => {
              const initials = client.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={client.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all active:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/${locale}/clients/${client.id}` as Route}
                      className="flex items-center gap-3 min-w-0 flex-1 focus:outline-none"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-xs font-bold text-white shadow-xs">
                        {initials || <User className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{client.name}</p>
                        {client.phone ? (
                          <p className="flex items-center gap-1 text-xs text-slate-500 truncate mt-0.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{client.phone}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">Aucun numéro</p>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        <FileText className="h-3 w-3 text-slate-500" />
                        {client._count.documents}
                      </span>
                      <Link
                        href={`/${locale}/clients/${client.id}` as Route}
                        aria-label={`Voir le client ${client.name}`}
                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        Voir
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VUE TABLETTE & DESKTOP (Tableau classique anti-débordement) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Téléphone</th>
                    <th className="text-center">Documents</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="group">
                      <td className="font-semibold text-slate-900">{client.name}</td>
                      <td className="text-slate-600 font-mono text-xs">{client.phone ?? '—'}</td>
                      <td className="text-center">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {client._count.documents}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/${locale}/clients/${client.id}` as Route}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          <span>Voir fiche</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
