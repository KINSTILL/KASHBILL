'use client';
import { useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatXaf } from '@/lib/pdf/shared/format';
import { formatDate } from '@/lib/utils';
import { haptic } from '@/lib/device/haptics';
import { useToast } from '@/components/ui/Toast';
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
  const router = useRouter();
  const toast = useToast();
  const config = DOC_TYPE_CONFIG[type];
  const shortLabel = locale === 'en' ? config.shortLabelEn : config.shortLabel;

  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    haptic('medium');
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'fetch' },
      });
      if (!res.ok) {
        toast.show(t('deleteError'), 'error');
        return;
      }
      toast.show(t('deleted'), 'success');
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.show(t('deleteError'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="surface group relative overflow-hidden p-4 transition-smooth hover:-translate-y-0.5">
      <Link
        href={`/${locale}/documents/${id}` as Route}
        className="flex items-start gap-3"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-xl">
          {config.icon}
        </div>
        <div className="min-w-0 flex-1 pr-8">
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
    </Link>

      {/* Bouton supprimer */}
      <button
        type="button"
        aria-label={t('delete')}
        onClick={() => {
          haptic('light');
          setConfirmOpen(true);
        }}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 opacity-100 transition-smooth hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 focus-ring"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M4 7h16" />
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
          <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
      </button>

      {/* Confirmation */}
      {confirmOpen && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[18px] bg-white/95 p-4 backdrop-blur-sm">
          <p className="text-center text-[13px] font-medium text-ink">{t('deleteConfirm')}</p>
          <div className="flex w-full gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmOpen(false)}
              className="transition-smooth focus-ring flex-1 rounded-btn border border-slate-200 bg-white py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('cancelDelete')}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="transition-smooth focus-ring flex-1 rounded-btn bg-red-600 py-2 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? '…' : t('delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
