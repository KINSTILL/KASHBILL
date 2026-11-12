'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import type { PdfDocument, PdfFormat } from '@/lib/pdf/types';
import { PdfViewer } from './PdfViewer';
import { haptic } from '@/lib/device/haptics';

/**
 * Aperçu = le PDF exact que le serveur produira (même source pour l'aperçu, l'envoi et le téléchargement).
 */
export function DocumentPreview({
  pdfDoc,
  initialFormat,
}: {
  pdfDoc: PdfDocument;
  initialFormat: PdfFormat;
}) {
  const t = useTranslations('documents.preview');
  const locale = useLocale();
  const router = useRouter();
  const [format, setFormat] = useState<PdfFormat>(initialFormat);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/documents/${pdfDoc.id}/pdf?format=${format}`, {
      headers: { 'X-Requested-With': 'fetch' },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((b) => {
        if (mounted) {
          setBlob(b);
          try {
            localStorage.setItem('kashbill:has_created_doc', '1');
          } catch {}
        }
      })
      .catch((e) => {
        if (mounted && e?.name !== 'AbortError') setError(e instanceof Error ? e.message : 'PDF error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [pdfDoc.id, format]);

  const go = (path: string) => {
    haptic('medium');
    router.push(`/${locale}/documents/${pdfDoc.id}/${path}`);
  };

  return (
    <div className="space-y-4">
      {/* Format A4 / Ticket 80mm */}
      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
        <div className="flex gap-1">
          {(['a4', 'ticket'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              aria-pressed={format === f}
              className={`min-h-11 rounded-md px-3 py-1.5 text-xs font-semibold transition sm:min-h-0 ${
                format === f ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {f === 'a4' ? '📄 A4' : '🧾 Ticket 80mm'}
            </button>
          ))}
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 pr-2 text-xs text-slate-500">
            <Spinner size="sm" />
            <span>{t('loadingPdf')}</span>
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {t('pdfError')} ({error})
        </div>
      ) : (
        <PdfViewer blob={blob} filename={`${pdfDoc.number}.pdf`} />
      )}

      <div className="space-y-2">
        <Button fullWidth size="lg" disabled={!blob} onClick={() => go('envoyer')}>
          {t('send')}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" fullWidth onClick={() => go('programmer')}>
            ⏱️ {t('schedule')}
          </Button>
          <Button variant="outline" fullWidth onClick={() => go('envoi-masse')}>
            👥 {t('sendBulk')}
          </Button>
        </div>
      </div>
    </div>
  );
}
