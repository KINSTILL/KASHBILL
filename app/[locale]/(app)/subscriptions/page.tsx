'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { CreditCard, Download, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { formatXaf } from '@/lib/pdf/shared/format';
import { formatDate } from '@/lib/utils';

type Invoice = {
  id: string;
  number: string;
  amountXaf: number;
  totalXaf: number;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  pdfPath: string | null;
  locale: 'FR' | 'EN';
};

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions');
  const commonT = useTranslations('common');
  const locale = useLocale() as 'fr' | 'en';
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);

  useEffect(() => {
    fetch('/api/subscriptions/invoices')
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices ?? []))
      .catch(() => setInvoices([]));
  }, []);

  const download = (id: string, number: string) => {
    const a = document.createElement('a');
    a.href = `/api/subscriptions/invoices/${id}/download`;
    a.download = `${number}.pdf`;
    a.click();
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 truncate">
              {t('title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              {t('subtitle')}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/settings` as Route}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 shrink-0 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{commonT('back')}</span>
        </Link>
      </div>

      {invoices === null ? (
        <SkeletonList rows={3} />
      ) : invoices.length === 0 ? (
        <EmptyState icon="📄" title={t('empty')} description={t('emptyHelp')} />
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50/70 transition"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono font-bold text-slate-900 truncate">
                    {inv.number}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(new Date(inv.paidAt), locale)} · {t('period')}{' '}
                    {formatDate(new Date(inv.periodStart), locale)} →{' '}
                    {formatDate(new Date(inv.periodEnd), locale)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="money text-sm font-bold text-slate-950">
                  {formatXaf(inv.totalXaf)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => download(inv.id, inv.number)}
                  disabled={!inv.pdfPath}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
