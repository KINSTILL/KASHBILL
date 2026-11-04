'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { renderPdfToBlob } from '@/lib/pdf/render';
import type { PdfDocument, PdfFormat } from '@/lib/pdf/types';
import { ShareSheet } from '@/components/share/ShareSheet';
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
  const [shareOpen, setShareOpen] = useState(false);

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
    renderPdfToBlob(pdfDoc, initialFormat, options)
      .then((b) => {
        if (mounted) setBlob(b);
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
      <div className="rounded-lg border border-slate-200 bg-white p-2">
        {blob && (
          <object data={URL.createObjectURL(blob)} type="application/pdf" className="h-[60vh] w-full">
            <p>PDF preview not available</p>
          </object>
        )}
      </div>
      <div className="space-y-2">
        <Button
          fullWidth
          size="lg"
          onClick={() => {
            haptic('medium');
            setShareOpen(true);
          }}
        >
          {t('send')}
        </Button>
      </div>
      {blob && (
        <ShareSheet
          open={shareOpen}
          onOpenChange={setShareOpen}
          docType={pdfDoc.type}
          clientName={pdfDoc.client?.name ?? ''}
          clientPhone={pdfDoc.client?.phone ?? null}
          pdfBlob={blob}
          documentNumber={pdfDoc.number}
          documentId={pdfDoc.id}
          onSent={() => {}}
        />
      )}
    </div>
  );
}

