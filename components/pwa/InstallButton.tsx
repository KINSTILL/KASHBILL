'use client';

import { usePWAInstall } from '@/lib/hooks/usePWAInstall';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export function InstallButton({
  variant = 'header',
}: {
  variant?: 'header' | 'sidebar';
}) {
  const t = useTranslations('pwa');
  const { canInstall, isDesktop, isStandalone, promptInstall } = usePWAInstall();

  if (!canInstall || isStandalone) return null;

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={() => promptInstall()}
        className="w-full text-left rounded-lg px-3 py-2 text-xs font-semibold bg-sage-50 text-sage-900 border border-sage-200 hover:bg-sage-100 flex items-center justify-between transition-colors cursor-pointer"
      >
        <span>{t('installSidebarDesktop')}</span>
        <span>⬇</span>
      </button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => promptInstall()}
      className="h-8 gap-1.5 border-sage-300 bg-white text-xs font-semibold text-slate-800 shadow-xs hover:bg-sage-50 cursor-pointer"
    >
      <span>{isDesktop ? '💻' : '📲'}</span>
      <span className="hidden sm:inline">
        {isDesktop ? t('installHeader') : t('buttonInstall')}
      </span>
    </Button>
  );
}

