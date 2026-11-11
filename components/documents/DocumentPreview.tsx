'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { renderPdfToBlob } from '@/lib/pdf/render';
import type { PdfDocument, PdfFormat } from '@/lib/pdf/types';
import { ShareSheet } from '@/components/share/ShareSheet';
import { RecurringSheet } from './RecurringSheet';
import { BulkSheet } from './BulkSheet';
import { PdfViewer } from './PdfViewer';
import { HtmlDocumentPreview } from './HtmlDocumentPreview';
import { ProPreviewToggle } from './ProPreviewToggle';
import { haptic } from '@/lib/device/haptics';

export function DocumentPreview({
  pdfDoc,
  initialFormat,
}: {
  pdfDoc: PdfDocument;
  initialFormat: PdfFormat;
}) {
  const t = useTranslations('documents.preview');
  const [format, setFormat] = useState<PdfFormat>(initialFormat);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [previewPro, setPreviewPro] = useState(false);

  const showWatermark = previewPro ? false : pdfDoc.watermarked;

  const options = useMemo(
    () => ({
      format,
      showLogo: true,
      showSignature: true,
      showStamp: true,
      showCgv: true,
      showWatermark,
      whiteLabel: pdfDoc.whiteLabel ?? false,
    }),
    [format, showWatermark, pdfDoc.whiteLabel]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setBlob(null);
    renderPdfToBlob(pdfDoc, format, options)
      .then((b) => {
        if (mounted) {
          setBlob(b);
          try {
            localStorage.setItem('kashbill:has_created_doc', '1');
          } catch {}
        }
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : 'PDF generation failed');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [pdfDoc, format, options]);

  return (
    <div className="space-y-4">
      {/* Sélecteur de format A4 / Ticket 80mm */}
      <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setFormat('a4')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              format === 'a4'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            📄 A4 Pro
          </button>
          <button
            type="button"
            onClick={() => setFormat('ticket')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              format === 'ticket'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            🧾 Ticket 80mm
          </button>
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 pr-2 text-xs text-slate-500">
            <Spinner size="sm" />
            <span>{t('loadingPdf')}</span>
          </div>
        )}
      </div>

      {/* Aperçu visuel HTML immédiat (toujours visible sur mobile et desktop) */}
      <HtmlDocumentPreview
        doc={pdfDoc}
        format={format}
        showWatermark={showWatermark}
      />

      {/* Lecteur / Téléchargement PDF natif */}
      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {t('pdfError')} ({error})
        </div>
      ) : (
        <PdfViewer blob={blob} filename={`${pdfDoc.number}.pdf`} />
      )}

      <div className="space-y-2">
        <Button
          fullWidth
          size="lg"
          disabled={!blob}
          onClick={() => {
            haptic('medium');
            setShareOpen(true);
          }}
        >
          {t('send')}
        </Button>
        <ProPreviewToggle
          enabled={previewPro}
          onToggle={setPreviewPro}
          isPro={!pdfDoc.watermarked}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              haptic('medium');
              setRecurringOpen(true);
            }}
          >
            ⏱️ {t('schedule')}
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              haptic('medium');
              setBulkOpen(true);
            }}
          >
            👥 {t('sendBulk')}
          </Button>
        </div>
      </div>
      {blob && (
        <ShareSheet
          open={shareOpen}
          onOpenChange={setShareOpen}
          docType={pdfDoc.type}
          clientName={pdfDoc.client?.name ?? ''}
          clientPhone={pdfDoc.client?.phone ?? null}
          clientEmail={pdfDoc.client?.email ?? null}
          pdfBlob={blob}
          documentNumber={pdfDoc.number}
          documentId={pdfDoc.id}
          docLocale={pdfDoc.locale}
          onSent={() => {}}
        />
      )}
      <RecurringSheet
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        documentId={pdfDoc.id}
        documentNumber={pdfDoc.number}
      />
      <BulkSheet
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        documentId={pdfDoc.id}
        documentNumber={pdfDoc.number}
      />
    </div>
  );
}
