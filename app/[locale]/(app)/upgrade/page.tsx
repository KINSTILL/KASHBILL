'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isSupportedPaymentCountry, getOperatorsForCountry } from '@/lib/countries/mobile-money';

export default function UpgradePage() {
  const t = useTranslations('upgrade');
  const toast = useToast();
  const search = useSearchParams();
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ proUntil: string | null; role: string } | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const userCountry = user?.country;
  const canPayMobileMoney = isSupportedPaymentCountry(userCountry ?? 'CM');
  const operators = canPayMobileMoney ? getOperatorsForCountry(userCountry ?? 'CM') : [];

  const ref = search.get('ref');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setStatus({ proUntil: d.user.proUntil, role: d.user.role });
        }
      })
      .catch(() => {});
  }, []);

  // Si on revient du paiement (ref dans l'URL), on poll /api/auth/me toutes les 3s pendant 60s
  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled || pollCount >= 20) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.proUntil && new Date(data.user.proUntil) > new Date()) {
            setStatus({ proUntil: data.user.proUntil, role: data.user.role });
            clearInterval(interval);
          }
        }
      } catch {}
      setPollCount((c) => c + 1);
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ref, pollCount]);

  const startPayment = async (method: 'mobile_money' | 'card', operatorCode: string | null) => {
    setLoading(method === 'card' ? 'card' : (operatorCode ?? 'mobile_money'));
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ method, operatorCode }),
      });
      if (!res.ok) {
        toast.show("Erreur lors de l'initialisation du paiement", 'error');
        return;
      }
      const { authorizationUrl } = await res.json();
      window.location.href = authorizationUrl;
    } finally {
      setLoading(null);
    }
  };

  const proUntil = status?.proUntil;
  const isActive = proUntil && new Date(proUntil) > new Date();

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-slate-600">{t('subtitle')}</p>

      {isActive && (
        <Card className="p-4">
          <p className="text-sm text-slate-500">{t('currentStatus')}</p>
          <p className="text-lg font-bold text-sage-700">
            {t('statusPro')} — {t('expiresOn', { date: new Date(proUntil).toLocaleDateString('fr-CM') })}
          </p>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-semibold">{t('features')}</h2>
        <ul className="space-y-1 text-sm">
          <li>✓ {t('featureNoWatermark')}</li>
          <li>✓ {t('featureLogo')}</li>
          <li>✓ {t('featureUnlimitedClients')}</li>
          <li>✓ {t('featureUnlimitedHistory')}</li>
          <li>✓ {t('feature2Devices')}</li>
          <li>✓ {t('featureNfc')}</li>
          <li>✓ {t('featureUsbPrint')}</li>
        </ul>
      </Card>

      {canPayMobileMoney ? (
        <div className="space-y-2">
          {operators.map((op) => (
            <Button
              key={op.code}
              fullWidth
              size="lg"
              onClick={() => startPayment('mobile_money', op.code)}
              isLoading={loading === op.code}
            >
              💳 {op.name} — 2 000 FCFA
            </Button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-900">⚠️ {t('mobileMoneyNotAvailable')}</p>
            <p className="mt-1 text-xs text-amber-800">{t('cardPaymentAvailable')}</p>
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() => startPayment('card', null)}
            isLoading={loading === 'card'}
          >
            💳 {t('payByCard')} — 2 000 FCFA
          </Button>
        </div>
      )}

      {ref && (
        <Card className="p-4">
          <p className="text-sm text-slate-600">
            Paiement en cours de vérification… ({pollCount}/20)
          </p>
        </Card>
      )}

      <div className="border-t pt-4 text-center text-sm text-slate-500">
        {t('or')}{' '}
        <Link href={'/referrals' as Route} className="text-sage-700 underline">
          {t('refer')}
        </Link>
      </div>
    </div>
  );
}
