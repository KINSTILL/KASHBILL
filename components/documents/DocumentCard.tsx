'use client';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatXaf } from '@/lib/pdf/shared/format';
import { formatDate } from '@/lib/utils';
import type { DocType } from '@prisma/client';

type Props = {
  id: string;
  number: string;
  type: DocType;
  clientName: string | null;
  total: number;
  createdAt: Date;
  sentViaWhatsAppAt: Date | null;
  watermarked: boolean;
};

export function DocumentCard({
  id,
  number,
  type,
  clientName,
  total,
  createdAt,
  sentViaWhatsAppAt,
}: Props) {
  const locale = useLocale() as 'fr' | 'en';
  const t = useTranslations('documents.list');
  const config = DOC_TYPE_CONFIG[type];
  const shortLabel = locale === 'en' ? config.shortLabelEn : config.shortLabel;

  return (
    <Link
      href={`/${locale}/documents/${id}` as Route}
      className="surface block p-4 transition-smooth hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-xl">
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[14px] font-semibold text-ink">
              {shortLabel}
              <span className="ml-1.5 text-[11px] font-medium text-slate-400">{number}</span>
            </p>
            <p className="money shrink-0 text-[14px] text-ink">{formatXaf(total)}</p>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-slate-500">
            {clientName ?? '—'} · {formatDate(createdAt, locale)}
          </p>
          {sentViaWhatsAppAt && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#E7F8EE] px-2 py-0.5 text-[10px] font-semibold text-whatsapp-dark">
              ✓ {t('sent')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

