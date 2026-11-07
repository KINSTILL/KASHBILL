'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';

export function ProPreviewToggle({
  enabled,
  onToggle,
  isPro,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  isPro: boolean;
}) {
  const t = useTranslations('proPreview');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  if (isPro) return null;

  const handleClick = () => {
    if (enabled) {
      onToggle(false);
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        fullWidth
        variant={enabled ? 'primary' : 'secondary'}
        onClick={handleClick}
      >
        {enabled ? t('backToFree') : t('viewPro')}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{t('sheetTitle')}</h2>
          <p className="text-sm text-slate-600">{t('sheetSubtitle')}</p>
          <div className="rounded-lg border border-sage-200 bg-sage-50 p-4">
            <p className="text-sm font-semibold text-sage-900">
              {t('benefit1')}
            </p>
            <p className="mt-1 text-sm font-semibold text-sage-900">
              {t('benefit2')}
            </p>
            <p className="mt-1 text-sm font-semibold text-sage-900">
              {t('benefit3')}
            </p>
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() => {
              setOpen(false);
              onToggle(true);
            }}
          >
            {t('showPreview')}
          </Button>
          <Button
            fullWidth
            variant="ghost"
            onClick={() => {
              setOpen(false);
              window.location.href = `/${locale}/upgrade`;
            }}
          >
            {t('upgradeNow')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

