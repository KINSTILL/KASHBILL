'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

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

  if (!blob) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50"
        style={{ height: '300px' }}
      >
        <span className="text-sm text-slate-500">{t('loadingPdf')}</span>
      </div>
    );
  }

  if (!url) return null;

  const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIos) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">{t('iosPreviewHelp')}</p>
        <Button
          variant="primary"
          size="md"
          onClick={() => window.open(url, '_blank')}
          className="mt-3"
        >
          {t('openPdf')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="overflow-hidden rounded-lg border border-slate-200 bg-white"
        style={{ height }}
      >
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          title={filename}
          className="h-full w-full"
          loading="lazy"
        />
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => window.open(url, '_blank')}>
          {t('openInNewTab')}
        </Button>
      </div>
    </div>
  );
}
