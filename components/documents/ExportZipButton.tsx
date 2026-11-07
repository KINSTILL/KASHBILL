'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/device/haptics';

export function ExportZipButton({ from, to }: { from?: string; to?: string }) {
  const t = useTranslations('documents.export');
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    haptic('medium');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const url = `/api/documents/export-zip${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'X-Requested-With': 'fetch' },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.show(err?.error?.message ?? t('exportError'), 'error');
        return;
      }

      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `mycashbill-export-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.show(t('exportSuccess'), 'success');
    } catch {
      toast.show(t('exportError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport} isLoading={loading}>
      📦 {t('exportZip')}
    </Button>
  );
}

