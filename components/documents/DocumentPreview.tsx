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
import { haptic } from '@/lib/device/haptics';

export function DocumentPreview({
  pdfDoc,
  initialFormat,
}: {
  pdfDoc: PdfDocument;
  initialFormat: PdfFormat;
}) {
  const t = useTranslations('documents.preview');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const options = useMemo(
    () => ({
      format: initialFormat,
      showLogo: true,
      showSignature: true,
      showStamp: true,
      showCgv: true,
      showWatermark: pdfDoc.watermarked,
    }),
    [initialFormat, pdfDoc.watermarked]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setBlob(null);
    renderPdfToBlob(pdfDoc, initialFormat, options)
      .then((b) => {
        if (mounted) setBlob(b);
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
  }, [pdfDoc, initialFormat, options]);

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-error bg-red-50 p-4 text-sm text-error">
          {t('pdfError')}
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

