'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { downloadBlob } from '@/lib/pdf/render';

export function PdfViewer({
  blob,
  filename,
  height = '70vh',
}: {
  blob: Blob | null;
  filename: string;
  height?: string;
}) {
  const t = useTranslations('documents.preview');
  const [url, setUrl] = useState<string | null>(null);
  const [showNativePdf, setShowNativePdf] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    urlRef.current = objectUrl;
    setUrl(objectUrl);
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [blob]);

  if (!blob || !url) return null;

  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadBlob(blob, filename)}
        >
          ⬇️ Télécharger PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank')}
        >
          📄 {isMobile ? t('openPdf') : t('openInNewTab')}
        </Button>
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNativePdf((v) => !v)}
          >
            {showNativePdf ? 'Masquer lecteur PDF' : 'Lecteur PDF intégré'}
          </Button>
        )}
      </div>
      {!isMobile && showNativePdf && (
        <div
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          style={{ height }}
        >
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            title={filename}
            className="h-full w-full"
          />
        </div>
      )}
    </div>
  );
}
