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
import { DocumentCard } from '@/components/documents/DocumentCard';
import { ExportPeriodSelector } from '@/components/documents/ExportPeriodSelector';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('nav.history')}
          </h1>
          <p className="text-xs text-slate-500">
            {documents.length} document{documents.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href={`/${locale}/documents/new` as Route}>
          <Button variant="primary" className="thumb-zone">
            + {t('nav.new')}
          </Button>
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
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              id={doc.id}
              number={doc.number}
              type={doc.type}
              clientName={doc.client?.name ?? null}
              total={(doc.payload as { total?: number } | null)?.total ?? 0}
              createdAt={doc.createdAt}
              sentViaWhatsAppAt={doc.sentViaWhatsAppAt}
              watermarked={doc.watermarked}
            />
          ))}
        </div>
      )}
    </div>
  );
}

