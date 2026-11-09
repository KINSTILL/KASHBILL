import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { isPro, getHistoryWindowDays } from '@/lib/auth/plan';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExportPeriodSelector } from '@/components/documents/ExportPeriodSelector';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatFCFA } from '@/lib/utils';

export default async function DocumentsPage({
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
  const historyDays = getHistoryWindowDays(user);
  const dateLimit = historyDays
    ? new Date(Date.now() - historyDays * 24 * 60 * 60 * 1000)
    : null;

  const documents = await prisma.document.findMany({
    where: {
      userId: user.id,
      ...(dateLimit ? { createdAt: { gte: dateLimit } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { client: true },
  });

  return (
    <div className="space-y-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">{documents.length} documents</p>
        </div>
        <Link href={`/${locale}/documents/new` as Route}>
          <Button size="md" variant="primary">+ Nouveau</Button>
        </Link>
      </div>

      <ExportPeriodSelector />

      {!pro && (
        <Card className="border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="flex items-center justify-between">
            <span>
              ℹ️ Historique gratuit limité aux {historyDays} derniers jours.
            </span>
            <Link
              href={`/${locale}/upgrade` as Route}
              className="font-semibold text-amber-900 underline hover:no-underline ml-2"
            >
              Passer Pro
            </Link>
          </div>
        </Card>
      )}

      {documents.length === 0 ? (
        <EmptyState
          title={t('dashboard.noDocuments')}
          description={t('dashboard.noDocumentsHelp')}
          action={
            <Link href={`/${locale}/documents/new` as Route}>
              <Button variant="primary">{t('dashboard.createFirst')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-100 bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Type</th>
                <th>Client</th>
                <th>Date</th>
                <th className="text-right">Total</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const total = (doc.payload as { total?: number } | null)?.total ?? 0;
                return (
                  <tr key={doc.id}>
                    <td className="font-mono text-xs text-slate-500">
                      <Link
                        href={`/${locale}/documents/${doc.id}` as Route}
                        className="hover:text-sage-700"
                      >
                        {doc.number}
                      </Link>
                    </td>
                    <td>{DOC_TYPE_CONFIG[doc.type]?.label}</td>
                    <td className="text-slate-600">{doc.client?.name ?? '—'}</td>
                    <td className="text-xs text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="text-right font-medium">{formatFCFA(total)}</td>
                    <td>
                      <span
                        className={`status-badge ${doc.sentViaWhatsAppAt ? 'status-success' : 'status-neutral'}`}
                      >
                        {doc.sentViaWhatsAppAt ? 'Envoyé' : 'Brouillon'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

