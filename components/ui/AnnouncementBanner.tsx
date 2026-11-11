'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import type { PlatformAnnouncement } from '@/lib/announcements';

export function AnnouncementBanner({
  announcement,
  dismissible = true,
}: {
  announcement: PlatformAnnouncement;
  dismissible?: boolean;
}) {
  const locale = useLocale();
  const isEn = locale === 'en';
  const [hidden, setHidden] = useState(dismissible);

  useEffect(() => {
    if (!dismissible) {
      setHidden(false);
      return;
    }
    try {
      const closed = localStorage.getItem(`kashbill_announcement_closed_${announcement.id}`);
      setHidden(closed === '1');
    } catch {
      setHidden(false);
    }
  }, [announcement.id, dismissible]);

  const handleClose = () => {
    setHidden(true);
    try {
      localStorage.setItem(`kashbill_announcement_closed_${announcement.id}`, '1');
    } catch {}
  };

  if (dismissible && hidden) {
    return null;
  }

  const formattedEndsAt = new Date(announcement.endsAt).toLocaleDateString(
    isEn ? 'en-US' : 'fr-FR',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-amber-50/80 via-emerald-50/60 to-teal-50 p-4 sm:p-5 shadow-sm transition-all">
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-emerald-200/40 blur-2xl" />

      <div className="relative z-10 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-base text-white shadow-xs">
              📢
            </span>
            <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
              {isEn ? 'Official Announcement' : 'Annonce MyCashBill'}
            </span>
          </div>

          {dismissible && (
            <button
              type="button"
              onClick={handleClose}
              title={isEn ? 'Hide announcement' : 'Masquer cette annonce'}
              className="rounded-full p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <span className="text-base font-bold leading-none">✕</span>
            </button>
          )}
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {announcement.title}
          </h2>
          <p className="mt-1 whitespace-pre-line text-xs sm:text-sm text-slate-700 leading-relaxed">
            {announcement.message}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
          <span>
            {isEn ? `Published until ${formattedEndsAt}` : `Publiée jusqu'au ${formattedEndsAt}`}
          </span>
          {dismissible && (
            <button
              type="button"
              onClick={handleClose}
              className="font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
            >
              {isEn ? 'Dismiss' : 'Masquer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfileAnnouncementBox() {
  const [announcement, setAnnouncement] = useState<PlatformAnnouncement | null>(null);

  useEffect(() => {
    fetch('/api/announcements')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.announcement) {
          setAnnouncement(data.announcement);
        }
      })
      .catch(() => {});
  }, []);

  if (!announcement) return null;
  return <AnnouncementBanner announcement={announcement} dismissible={false} />;
}
