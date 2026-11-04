'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ReferralsShareBox({
  code,
  link,
}: {
  code: string;
  link: string;
}) {
  const t = useTranslations('referrals');
  const commonT = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Rejoins-moi sur CashBill pour créer tes devis et factures professionnels hors-ligne ! Inscris-toi ici : ${link}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {t('yourCode')}
        </span>
        <div className="mt-1 flex items-center justify-between rounded-lg bg-slate-100 p-3">
          <span className="font-mono text-xl font-bold tracking-widest text-sage-800">
            {code}
          </span>
          <span className="text-xs text-slate-500">+7 jours Pro par activation</span>
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {t('yourLink')}
        </span>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-600 select-all"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? commonT('success') : t('copyLink')}
          </Button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          onClick={handleWhatsApp}
          className="w-full bg-[#25D366] text-white hover:bg-[#20BA5A] font-semibold thumb-zone flex items-center justify-center gap-2"
        >
          <span>💬</span>
          <span>{t('shareWhatsApp')}</span>
        </Button>
      </div>
    </Card>
  );
}

