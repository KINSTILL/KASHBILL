'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

type QuotaStatus = { used: number; limit: number | null; reached: boolean };
type FullQuota = {
  isPro: boolean;
  docs: QuotaStatus;
  whatsapp: QuotaStatus;
  emails: QuotaStatus;
  clients: QuotaStatus;
};

export function QuotaBadge() {
  const { user } = useCurrentUser();
  const t = useTranslations('quota');
  const locale = useLocale();
  const [quota, setQuota] = useState<FullQuota | null>(null);
  const [open, setOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch('/api/me/quota')
      .then((r) => r.json())
      .then(setQuota)
      .catch(() => {});
  }, [user, refresh]);

  // Re-fetch toutes les 30s si user actif
  useEffect(() => {
    if (!user) return;
    const i = setInterval(() => setRefresh((r) => r + 1), 30_000);
    return () => clearInterval(i);
  }, [user]);

  if (!user || !quota || quota.isPro) return null;
  if (quota.docs.limit === null) return null;

  const remaining = quota.docs.limit - quota.docs.used;
  const color =
    remaining <= 0
      ? 'bg-red-100 text-red-700 border-red-200'
      : remaining <= 2
        ? 'bg-orange-100 text-orange-700 border-orange-200'
        : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${color}`}
      >
        📊 {quota.docs.used}/{quota.docs.limit}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold">{t('title')}</h2>
          <p className="text-sm text-slate-600">{t('subtitle')}</p>
          <div className="space-y-2">
            <QuotaRow label={t('docs')} quota={quota.docs} />
            <QuotaRow label={t('whatsapp')} quota={quota.whatsapp} />
            <QuotaRow label={t('clients')} quota={quota.clients} />
          </div>
          <Button fullWidth size="lg" onClick={() => { window.location.href = `/${locale}/upgrade`; }}>
            {t('upgrade')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function QuotaRow({ label, quota }: { label: string; quota: QuotaStatus }) {
  if (quota.limit === null) return null;
  const pct = Math.min(100, (quota.used / quota.limit) * 100);
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-500' : 'bg-sage-500';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-ink">{quota.used}/{quota.limit}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

