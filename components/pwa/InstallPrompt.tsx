'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/lib/hooks/usePWAInstall';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

const DISMISS_KEY = 'mycashbill:install-prompt-snooze-until';
const VISIT_COUNT_KEY = 'mycashbill:visit-count';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours de répit doux

export function InstallPrompt() {
  const t = useTranslations('pwa');
  const { canInstall, isIOS, isDesktop, isInstalled, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // 1. Si déjà installé (détecté via OS, standalone ou installation précédente), ne rien afficher
      if (isInstalled) {
        setVisible(false);
        return;
      }

      // 2. Vérifier le snooze (si snoozé, masquer)
      const snoozeUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() < snoozeUntil) {
        setVisible(false);
        return;
      }

      // 3. Règle anti-pression : ne pas s'afficher à la toute première seconde de la 1ère visite
      const visitCount = Number(localStorage.getItem(VISIT_COUNT_KEY) || 0) + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));
      const hasCreatedDoc = localStorage.getItem('kashbill:has_created_doc') === '1';

      // Afficher uniquement si l'utilisateur a déjà interagi (au moins 2 visites ou 1 doc créé)
      if (visitCount >= 2 || hasCreatedDoc) {
        // Petit délai d'attente de 3 secondes pour ne pas surprendre au chargement
        const timer = setTimeout(() => {
          setVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } catch {
      setVisible(false);
    }
  }, [isInstalled]);

  if (!visible || isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
    } catch {}
    setVisible(false);
  };

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setVisible(false);
    } else {
      dismiss();
    }
  };

  return (
    <aside
      aria-label={t('install')}
      className="fixed z-50 transition-smooth animate-in fade-in slide-in-from-bottom-4 duration-300
        bottom-20 inset-x-3 max-w-sm mx-auto
        md:bottom-6 md:right-6 md:left-auto md:max-w-sm"
    >
      <div className="rounded-2xl border border-sage-300/80 bg-white/95 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-xl text-sage-800">
            {isDesktop ? '💻' : '📲'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {isDesktop ? t('installDesktop') : t('install')}
              </h3>
              <button
                type="button"
                onClick={dismiss}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded text-xs transition-colors cursor-pointer"
                title={t('buttonLater')}
                aria-label={t('buttonLater')}
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              {isIOS ? t('iosInstallHelp') : t('installHelp')}
            </p>

            <div className="mt-3 flex items-center gap-2">
              {canInstall && !isIOS && (
                <Button size="sm" onClick={handleInstall} className="font-semibold shadow-xs">
                  {t('buttonInstall')}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={dismiss} className="text-xs text-slate-600">
                {t('buttonLater')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
