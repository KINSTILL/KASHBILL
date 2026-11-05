import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { isPro, getHistoryWindowDays } from '@/lib/auth/plan';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/pdf/shared/format';

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
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {documents.map((doc) => {
            const payload = doc.payload as { total?: number } | null;
            const total = payload?.total ?? 0;
            const status = doc.sentViaWhatsAppAt ? 'SENT' : 'DRAFT';
            const statusVariant = status === 'SENT' ? 'info' : 'neutral';

            return (
              <Link
                key={doc.id}
                href={`/${locale}/documents/${doc.id}` as Route}
                className="flex items-center justify-between p-4 transition hover:bg-slate-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {doc.number}
                    </span>
                    <Badge variant={statusVariant} size="sm">
                      {doc.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {doc.client?.name || 'Sans client'} &bull;{' '}
                    {new Date(doc.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>

                <div className="text-right">
                  <div className="money text-sm text-ink">
                    {formatCurrency(total, 'FCFA')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {status}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

