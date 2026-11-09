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
  const t = await getTranslations();
  const pro = isPro(user);

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { documents: true } } },
  });

  const limitReached = !pro && clients.length >= FREE_CLIENTS_LIMIT;

  return (
    <div className="space-y-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">{clients.length} clients</p>
        </div>
        {!limitReached && (
          <Link href={`/${locale}/clients/new` as Route}>
            <Button size="md" variant="primary">+ Nouveau</Button>
          </Link>
        )}
      </div>

      {limitReached && (
        <UpgradeCTA reason="unlimitedClients" />
      )}

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
        <div className="rounded-xl border border-slate-100 bg-white">
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
                <tr key={client.id}>
                  <td className="font-medium text-ink">{client.name}</td>
                  <td className="text-slate-600">{client.phone ?? '—'}</td>
                  <td className="text-center text-slate-500">{client._count.documents}</td>
                  <td className="text-right">
                    <Link
                      href={`/${locale}/clients/${client.id}` as Route}
                      className="text-xs text-sage-600 hover:underline"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

