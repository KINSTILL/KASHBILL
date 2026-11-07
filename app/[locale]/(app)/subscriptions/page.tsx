'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
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
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink">{t('title')}</h1>
      <p className="text-sm text-slate-600">{t('subtitle')}</p>

      {invoices === null ? (
        <SkeletonList rows={3} />
      ) : invoices.length === 0 ? (
        <EmptyState icon="📄" title={t('empty')} description={t('emptyHelp')} />
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{inv.number}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatDate(new Date(inv.paidAt), locale)} · {t('period')}{' '}
                    {formatDate(new Date(inv.periodStart), locale)} → {formatDate(new Date(inv.periodEnd), locale)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="money text-[14px] text-ink">{formatXaf(inv.totalXaf)}</p>
                  <Button size="sm" variant="ghost" onClick={() => download(inv.id, inv.number)} disabled={!inv.pdfPath}>
                    ⬇️ PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

