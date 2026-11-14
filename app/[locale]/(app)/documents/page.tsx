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
import { DeleteDocumentButton } from '@/components/documents/DeleteDocumentButton';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatFCFA } from '@/lib/utils';
import { Plus, FileText, ChevronRight, CheckCircle2, Clock, Zap } from 'lucide-react';

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
    <div className="space-y-5">
      {/* En-tête de page optimisé mobile */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {documents.length} {documents.length > 1 ? 'documents enregistrés' : 'document'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/documents/scan` as Route} className="shrink-0">
            <Button size="md" variant="outline" className="gap-1.5 font-bold border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/80">
              <Zap className="h-4 w-4 fill-emerald-600 text-emerald-600" />
              <span>Scan express</span>
            </Button>
          </Link>
          <Link href={`/${locale}/documents/new` as Route} className="shrink-0">
            <Button size="md" className="gap-1.5 font-bold shadow-md shadow-emerald-900/10">
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nouveau</span>
            </Button>
          </Link>
        </div>
      </div>

      <ExportPeriodSelector />

      {!pro && (
        <Card className="border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <span>
              ℹ️ Historique gratuit limité aux {historyDays} derniers jours.
            </span>
            <Link
              href={`/${locale}/upgrade` as Route}
              className="font-bold text-amber-950 underline hover:no-underline"
            >
              Débloquer l&apos;historique illimité Pro &rarr;
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
        <>
          {/* VUE MOBILE (Cartes tactiles sans aucun scroll horizontal) */}
          <div className="space-y-2.5 sm:hidden">
            {documents.map((doc) => {
              const total = (doc.payload as { total?: number } | null)?.total ?? 0;
              const typeCfg = DOC_TYPE_CONFIG[doc.type];
              const isSent = Boolean(doc.sentViaWhatsAppAt);

              return (
                <div key={doc.id} className="relative">
                <Link
                  href={`/${locale}/documents/${doc.id}` as Route}
                  className="block rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all active:scale-[0.98] active:bg-slate-50 focus:outline-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <FileText className="h-4 w-4 stroke-[2.2]" />
                      </span>
                      <div className="min-w-0">
                        <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {typeCfg?.label || doc.type}
                        </span>
                        <p className="truncate text-xs font-mono font-semibold text-slate-500 mt-0.5">
                          {doc.number}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="money text-sm font-bold text-slate-950">
                        {formatFCFA(total)}
                      </span>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Envoyé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            <Clock className="h-2.5 w-2.5" />
                            Brouillon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 pr-8 text-xs text-slate-500">
                    <p className="truncate font-medium text-slate-700">
                      Client : <span className="font-semibold text-slate-900">{doc.client?.name ?? '—'}</span>
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                      {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </Link>
                {!doc.sentViaWhatsAppAt && !doc.sentViaEmailAt && (
                  <div className="absolute bottom-2 right-2">
                    <DeleteDocumentButton documentId={doc.id} documentNumber={doc.number} />
                  </div>
                )}
                </div>
              );
            })}
          </div>

          {/* VUE TABLETTE & DESKTOP (Tableau classique avec conteneur anti-débordement) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Type</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th className="text-right">Total</th>
                    <th>Statut</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const total = (doc.payload as { total?: number } | null)?.total ?? 0;
                    return (
                      <tr key={doc.id} className="group">
                        <td className="font-mono text-xs font-semibold text-slate-700">
                          <Link
                            href={`/${locale}/documents/${doc.id}` as Route}
                            className="hover:text-emerald-700"
                          >
                            {doc.number}
                          </Link>
                        </td>
                        <td>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {DOC_TYPE_CONFIG[doc.type]?.label}
                          </span>
                        </td>
                        <td className="font-medium text-slate-900">{doc.client?.name ?? '—'}</td>
                        <td className="text-xs text-slate-500">
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="text-right font-mono font-bold text-slate-900">
                          {formatFCFA(total)}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              doc.sentViaWhatsAppAt ? 'status-success' : 'status-neutral'
                            }`}
                          >
                            {doc.sentViaWhatsAppAt ? 'Envoyé' : 'Brouillon'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/${locale}/documents/${doc.id}` as Route}
                              aria-label={`Voir le document ${doc.number}`}
                              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              Voir
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                            {!doc.sentViaWhatsAppAt && !doc.sentViaEmailAt && (
                              <DeleteDocumentButton documentId={doc.id} documentNumber={doc.number} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
