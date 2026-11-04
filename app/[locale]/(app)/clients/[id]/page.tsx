import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/pdf/shared/format';
import { ClientDetailClient } from './ClientDetailClient';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const current = await getCurrentUser();

  if (!current) {
    redirect(`/${locale}/login` as Route);
  }

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client || client.userId !== current.user.id) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Détails du client
        </h1>
        <Link
          href={`/${locale}/clients` as Route}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Retour aux clients
        </Link>
      </div>

      <ClientDetailClient
        client={{
          id: client.id,
          name: client.name,
          phone: client.phone,
          address: client.address,
          note: client.note,
        }}
        locale={locale}
      />

      {/* Documents linked to this client */}
      <div className="space-y-3 pt-4">
        <h2 className="text-lg font-bold text-slate-900">
          Documents du client ({client.documents.length})
        </h2>

        {client.documents.length === 0 ? (
          <Card className="p-4 text-center text-xs text-slate-500">
            Aucun document émis pour ce client.
          </Card>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {client.documents.map((doc) => {
              const payload = doc.payload as { total?: number } | null;
              const total = payload?.total ?? 0;

              return (
                <Link
                  key={doc.id}
                  href={`/${locale}/documents/${doc.id}` as Route}
                  className="flex items-center justify-between p-3 transition hover:bg-slate-50 text-sm"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{doc.number}</span>
                    <span className="ml-2 text-xs text-slate-400">({doc.type})</span>
                    <p className="text-xs text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                  <div className="font-bold text-slate-900">
                    {formatCurrency(total, 'FCFA')}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

