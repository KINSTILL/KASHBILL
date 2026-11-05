'use client';
import { useEffect } from 'react';
import { listDrafts } from '@/lib/storage/drafts';

const REMINDER_AGE_MS = 24 * 60 * 60 * 1000; // 24h
const LAST_NOTIFIED_KEY = 'mycashbill:last-draft-notified';

export function DraftReminder() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    (async () => {
      try {
        const drafts = await listDrafts();
        const now = Date.now();
        const stale = drafts.filter((d) => now - d.updatedAt > REMINDER_AGE_MS);
        if (stale.length === 0) return;

        const lastNotified = Number(localStorage.getItem(LAST_NOTIFIED_KEY) ?? '0');
        if (now - lastNotified < 24 * 60 * 60 * 1000) return; // 1 notif max/jour

        new Notification('MyCashBill — brouillon en attente', {
          body: `Vous avez ${stale.length} brouillon(s) non finalisé(s). Reprenez-les maintenant.`,
          icon: '/icons/icon-192.png',
          tag: 'draft-reminder',
        });
        localStorage.setItem(LAST_NOTIFIED_KEY, String(now));
      } catch {}
    })();
  }, []);

  return null;
}

