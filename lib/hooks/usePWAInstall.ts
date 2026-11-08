'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const INSTALLED_STORAGE_KEY = 'mycashbill:pwa-installed';

export function usePWAInstall() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    setIsDesktop(!isMobileDevice);
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !('MSStream' in window));

    // 1. Détection mémoire locale persistante (si déjà installée par le passé)
    try {
      if (localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true') {
        setIsInstalled(true);
      }
    } catch {}

    // 2. Détection Standalone active (actuellement exécutée comme application PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.startsWith('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {}
    }

    // 3. Détection native OS via getInstalledRelatedApps (Chrome, Edge, Android)
    const nav = window.navigator as unknown as {
      getInstalledRelatedApps?: () => Promise<Array<{ platform: string; url?: string; id?: string }>>;
    };
    if (typeof nav.getInstalledRelatedApps === 'function') {
      nav.getInstalledRelatedApps()
        .then((apps) => {
          if (Array.isArray(apps) && apps.length > 0) {
            setIsInstalled(true);
            try {
              localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
            } catch {}
          }
        })
        .catch(() => {});
    }

    // 4. Capture du prompt d'installation
    const handler = (e: Event) => {
      // Si déjà marqué comme installé, ne pas capturer le prompt
      try {
        if (localStorage.getItem(INSTALLED_STORAGE_KEY) === 'true') {
          return;
        }
      } catch {}
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };

    // 5. Événement natif d'installation réussie
    const appInstalledHandler = () => {
      setDeferredEvent(null);
      setIsInstalled(true);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    if (!deferredEvent) return 'unsupported';
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, 'true');
      } catch {}
    }
    setDeferredEvent(null);
    return choice.outcome;
  };

  return {
    canInstall: deferredEvent !== null && !isInstalled,
    isIOS: isIOS && !isInstalled,
    isDesktop,
    isInstalled,
    promptInstall,
  };
}
