'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro, isInTrial } from '@/lib/auth/plan';

export default function UpgradePage() {
  const t = useTranslations('upgrade');
  const { user } = useCurrentUser();
  const [notice, setNotice] = useState<string | null>(null);

  const pro = user ? isPro(user) : false;
  const inTrial = user ? isInTrial(user) : false;

  const handlePayClick = () => {
    setNotice(
      "L'intégration paiement direct (Orange Money / MTN MoMo via Notch Pay) arrive à l'Étape 9 ! En attendant, partagez votre lien de parrainage pour obtenir +7 jours Pro par ami activé."
    );
  };

  const features = [
    { name: t('featureNoWatermark'), free: false, pro: true },
    { name: t('featureLogo'), free: false, pro: true },
    { name: t('featureUnlimitedClients'), free: '3 clients', pro: 'Illimité' },
    { name: t('featureUnlimitedHistory'), free: '7 jours', pro: 'Illimité' },
    { name: t('feature2Devices'), free: '1 appareil', pro: '2 appareils' },
    { name: t('featureNfc'), free: false, pro: true },
    { name: t('featureUsbPrint'), free: false, pro: true },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t('subtitle')}
        </p>
      </div>

      {/* Current status card */}
      <Card className="p-4 flex items-center justify-between bg-slate-50">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">
            {t('currentStatus')}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-bold text-slate-900">
              {inTrial ? t('statusTrial') : pro ? t('statusPro') : t('statusFree')}
            </span>
            <Badge variant={pro ? 'success' : 'neutral'} size="sm">
              {pro ? 'Actif' : 'Gratuit'}
            </Badge>
          </div>
        </div>

        {user?.proUntil && (
          <div className="text-right text-xs text-slate-500">
            {t('expiresOn', {
              date: new Date(user.proUntil).toLocaleDateString(),
            })}
          </div>
        )}
      </Card>

      {notice && (
        <div
          role="alert"
          className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs font-medium text-amber-900 leading-relaxed"
        >
          {notice}
        </div>
      )}

      {/* Feature comparison table */}
      <Card className="overflow-hidden">
        <div className="bg-slate-100 p-4 font-bold text-sm text-slate-800">
          {t('features')}
        </div>
        <div className="divide-y divide-slate-100 text-sm">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5">
              <span className="text-slate-800 font-medium">{feat.name}</span>
              <div className="flex items-center gap-6 text-xs">
                <span className="text-slate-400 w-20 text-center">
                  {typeof feat.free === 'boolean'
                    ? feat.free
                      ? '✓'
                      : '—'
                    : feat.free}
                </span>
                <span className="font-semibold text-sage-700 w-20 text-center">
                  {typeof feat.pro === 'boolean' ? '✓ Inclus' : feat.pro}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Action */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={handlePayClick}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold thumb-zone flex items-center justify-center gap-2"
        >
          <span>💳</span>
          <span>{t('pay')}</span>
        </Button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-slate-50 px-3 text-xs text-slate-400 uppercase">
            {t('or')}
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <Link href={'/referrals' as Route} className="block">
          <Button
            type="button"
            variant="outline"
            className="w-full border-sage-300 text-sage-800 hover:bg-sage-50 font-semibold thumb-zone"
          >
            🎁 {t('refer')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

