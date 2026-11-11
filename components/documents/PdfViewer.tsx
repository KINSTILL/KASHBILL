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

  if (isMobile) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank')}
        >
          📄 {t('openPdf')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadBlob(blob, filename)}
        >
          ⬇️ Télécharger PDF
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadBlob(blob, filename)}
        >
          ⬇️ Télécharger PDF
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.open(url, '_blank')}>
          {t('openInNewTab')}
        </Button>
      </div>
      <div
        className="overflow-hidden rounded-lg border border-slate-200 bg-white"
        style={{ height }}
      >
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          title={filename}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
