'use client';
import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/lib/hooks/usePWAInstall';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

const DISMISS_KEY = 'mycashbill:install-prompt-dismissed';

export function InstallPrompt() {
  const t = useTranslations('pwa');
  const tCommon = useTranslations('common');
  const { canInstall, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;
  if (!canInstall && !isIOS) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-2 bottom-20 z-50 rounded-lg border border-sage-300 bg-white p-3 shadow-lg md:hidden">
      <p className="mb-2 text-sm font-medium">{t('install')}</p>
      <p className="mb-3 text-xs text-slate-600">
        {isIOS ? t('iosInstallHelp') : t('installHelp')}
      </p>
      <div className="flex gap-2">
        {canInstall && !isIOS && (
          <Button size="sm" onClick={promptInstall}>
            {t('install')}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={dismiss}>
          {tCommon('cancel') ?? 'Plus tard'}
        </Button>
      </div>
    </div>
  );
}

