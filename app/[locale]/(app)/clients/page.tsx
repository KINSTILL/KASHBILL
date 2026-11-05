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
import { ClientCard } from '@/components/clients/ClientCard';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('nav.clients')}
          </h1>
          <p className="text-xs text-slate-500">
            {clients.length} {pro ? 'clients (illimités)' : `/ ${FREE_CLIENTS_LIMIT} clients (gratuit)`}
          </p>
        </div>
        {!limitReached && (
          <Link href={`/${locale}/clients/new` as Route}>
            <Button variant="primary" className="thumb-zone">
              + {t('common.add')}
            </Button>
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
        <div className="space-y-2">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              id={client.id}
              name={client.name}
              phone={client.phone ?? null}
              note={client.note ?? null}
              documentsCount={client._count.documents}
            />
          ))}
        </div>
      )}
    </div>
  );
}

