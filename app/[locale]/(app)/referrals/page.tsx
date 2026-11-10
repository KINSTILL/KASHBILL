'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type ReferralMeData = {
  referralCode: string;
  referralLink: string;
  stats: {
    total: number;
    activated: number;
    proDaysEarned: number;
  };
  pendingProDays: number;
};

type ReferralHistoryItem = {
  id: string;
  status: string;
  filleul: {
    name: string | null;
    phone: string;
  } | null;
};

export default function ReferralsPage() {
  const t = useTranslations('referrals');
  const [data, setData] = useState<ReferralMeData | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);

  useEffect(() => {
    fetch('/api/referrals/me')
      .then((r) => r.json())
      .then(setData);
    fetch('/api/referrals/me/history')
      .then((r) => r.json())
      .then((d) => setHistory(d.referrals ?? []));
  }, []);

  if (!data) return <p className="p-4 text-slate-500">Chargement…</p>;

  const shareWhatsApp = () => {
    const msg = `Découvre MyCashBill pour faire tes factures en 60 secondes : ${data.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(data.referralLink);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">{t('title')}</h1>
      <p className="text-sm text-slate-600">{t('subtitle')}</p>

      <Card>
        <p className="text-sm text-slate-500">{t('yourCode')}</p>
        <p className="text-2xl font-mono font-bold tracking-wider">{data.referralCode}</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <Button onClick={copyLink} variant="secondary" size="sm" className="w-full sm:w-auto">
            {t('copyLink')}
          </Button>
          <Button onClick={shareWhatsApp} variant="whatsapp" size="sm" className="w-full sm:w-auto">
            {t('shareWhatsApp')}
          </Button>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-medium">{t('stats')}</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-500">{t('filleulsTotal')}</p>
            <p className="text-xl font-bold">{data.stats?.total ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('filleulsActivated')}</p>
            <p className="text-xl font-bold">{data.stats?.activated ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('proDaysEarned')}</p>
            <p className="text-xl font-bold text-sage-700">
              {data.stats?.proDaysEarned ?? 0}
            </p>
          </div>
        </div>
      </Card>

      {history.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-medium">{t('history')}</p>
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="flex justify-between text-sm py-1 border-b last:border-b-0">
                <span>{r.filleul?.name ?? r.filleul?.phone}</span>
                <span
                  className={
                    r.status === 'REWARDED' ? 'text-success font-medium' : 'text-slate-500'
                  }
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
