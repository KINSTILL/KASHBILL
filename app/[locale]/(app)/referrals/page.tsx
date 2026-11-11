'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Gift, Copy, Check, Share2, Users, Sparkles, ArrowLeft, Crown } from 'lucide-react';
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
  const commonT = useTranslations('common');
  const locale = useLocale();
  const [data, setData] = useState<ReferralMeData | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referrals/me')
      .then((r) => r.json())
      .then(setData);
    fetch('/api/referrals/me/history')
      .then((r) => r.json())
      .then((d) => setHistory(d.referrals ?? []));
  }, []);

  if (!data) {
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        {locale === 'en' ? 'Loading…' : 'Chargement…'}
      </div>
    );
  }

  const shareWhatsApp = () => {
    const msg = `Découvre MyCashBill pour faire tes factures en 60 secondes : ${data.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
            <Gift className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 truncate">
              {t('title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              {t('subtitle')}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/settings` as Route}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 shrink-0 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{commonT('back')}</span>
        </Link>
      </div>

      {/* Carte Code de parrainage */}
      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              {t('yourCode')}
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-slate-950">
              {data.referralCode}
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-700 border border-emerald-200">
            <Sparkles className="h-6 w-6" />
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            onClick={copyLink}
            variant="secondary"
            size="md"
            className="w-full sm:w-auto gap-2 font-semibold"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? (locale === 'en' ? 'Copied!' : 'Copié !') : t('copyLink')}</span>
          </Button>
          <Button
            onClick={shareWhatsApp}
            variant="whatsapp"
            size="md"
            className="w-full sm:w-auto gap-2 font-semibold"
          >
            <Share2 className="h-4 w-4" />
            <span>{t('shareWhatsApp')}</span>
          </Button>
        </div>
      </div>

      {/* Grille Statistiques */}
      <div className="space-y-2">
        <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {t('stats')}
        </h2>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 text-center shadow-xs">
            <p className="text-[11px] font-medium text-slate-500">{t('filleulsTotal')}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {data.stats?.total ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 text-center shadow-xs">
            <p className="text-[11px] font-medium text-slate-500">{t('filleulsActivated')}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {data.stats?.activated ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-3.5 text-center shadow-xs">
            <p className="text-[11px] font-medium text-emerald-800">{t('proDaysEarned')}</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">
              {data.stats?.proDaysEarned ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Historique des filleuls */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {t('history')}
          </h2>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            {history.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-3.5 sm:p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {r.filleul?.name ?? r.filleul?.phone}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    r.status === 'REWARDED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {r.status === 'REWARDED' && <Crown className="h-3 w-3" />}
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
