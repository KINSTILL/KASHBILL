'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { MiniFAQ } from '@/components/faq/MiniFAQ';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isSupportedPaymentCountry, getOperatorsForCountry } from '@/lib/countries/mobile-money';

export default function UpgradePage() {
  const locale = useLocale();
  const t = useTranslations('upgrade');
  const tAddons = useTranslations('addons');
  const toast = useToast();
  const search = useSearchParams();
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ proUntil: string | null; role: string } | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const isConsumer = user?.accountType === 'CONSUMER';
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

      {isConsumer && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">
            {locale === 'fr'
              ? 'Compte particulier. En souscrivant, vous confirmez la renonciation à votre droit de rétractation acceptée lors de votre inscription. Aucun remboursement après paiement.'
              : 'Individual account. By subscribing, you confirm the withdrawal waiver accepted at registration. No refund after payment.'}
          </p>
        </div>
      )}

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
              📱 {op.name} — 2 000 FCFA
            </Button>
          ))}
          <button
            type="button"
            onClick={() => startPayment('card', null)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 underline pt-1"
          >
            {t('payByCard')} (Visa, Mastercard) — 2 000 FCFA
          </button>
          <p className="text-center text-[11px] text-slate-400 pt-1">
            🔒 {locale === 'fr'
              ? 'Paiement traité et sécurisé par Notch Pay (aucun transfert direct vers un portefeuille personnel)'
              : 'Payment processed and secured by Notch Pay (no direct transfer to personal wallets)'}
          </p>
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
          <p className="text-center text-[11px] text-slate-400 pt-1">
            🔒 {locale === 'fr'
              ? 'Paiement traité et sécurisé par Notch Pay (aucun transfert direct vers un portefeuille personnel)'
              : 'Payment processed and secured by Notch Pay (no direct transfer to personal wallets)'}
          </p>
        </div>
      )}

      {user?.proUntil && new Date(user.proUntil) > new Date() && (
        <div className="space-y-3 pt-4 border-t">
          <h2 className="text-lg font-bold">{tAddons('title')}</h2>
          <AddOnCard
            type="EXTRA_DEVICE"
            price={500}
            title={tAddons('extraDevice')}
            desc={tAddons('extraDeviceDesc')}
            canPayMobileMoney={canPayMobileMoney}
            operators={operators}
          />
          <AddOnCard
            type="WHITE_LABEL"
            price={3000}
            title={tAddons('whiteLabel')}
            desc={tAddons('whiteLabelDesc')}
            canPayMobileMoney={canPayMobileMoney}
            operators={operators}
          />
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

      <MiniFAQWrapper />
    </div>
  );
}

function MiniFAQWrapper() {
  const locale = useLocale();
  const isFr = locale === 'fr';

  const defaultBillingEntries = isFr
    ? [
        {
          id: 'faq-momo',
          question: 'Comment payer par Mobile Money ?',
          answer:
            'Sélectionnez votre opérateur (MTN MoMo, Orange Money ou Wave). Vous saisissez votre numéro de téléphone et validez le paiement directement avec votre code secret sur votre téléphone via le prompt USSD sécurisé Notch Pay.',
        },
        {
          id: 'faq-renewal',
          question: 'Puis-je annuler ? Y a-t-il un prélèvement automatique forcé ?',
          answer:
            'Non, aucun prélèvement automatique forcé. Vous payez 2 000 FCFA pour 30 jours d’accès Pro sans engagement. À la fin de la période, vous décidez vous-même si vous souhaitez renouveler.',
        },
        {
          id: 'faq-data',
          question: 'Que deviennent mes données si mon abonnement Pro expire ?',
          answer:
            'Toutes vos données (clients enregistrés, devis, factures) restent intactes et accessibles à tout moment. Vous repassez simplement sur le plan gratuit avec filigrane, sans aucune perte de vos historiques.',
        },
      ]
    : [
        {
          id: 'faq-momo',
          question: 'How to pay with Mobile Money?',
          answer:
            'Select your operator (MTN MoMo, Orange Money, or Wave). Enter your phone number and confirm the payment on your phone with your secret PIN via the secure Notch Pay USSD prompt.',
        },
        {
          id: 'faq-renewal',
          question: 'Can I cancel? Is there forced automatic renewal?',
          answer:
            'No forced automatic recurring billing. You pay 2,000 FCFA for 30 days of Pro access with zero commitment. You decide when and if you wish to renew.',
        },
        {
          id: 'faq-data',
          question: 'What happens to my data if my Pro plan expires?',
          answer:
            'All your documents, clients, and history remain completely safe and accessible. You simply transition to the free tier without losing any past invoices.',
        },
      ];

  const [entries, setEntries] = useState<Array<{ id: string; question: string; answer: string }>>(defaultBillingEntries);

  useEffect(() => {
    fetch(`/api/faq?category=billing&locale=${locale}&limit=4`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.entries?.length) {
          setEntries(d.entries);
        }
      })
      .catch(() => {});
  }, [locale]);

  return <MiniFAQ entries={entries} title={isFr ? 'Questions fréquentes sur le paiement' : 'Billing FAQ'} />;
}

function AddOnCard({
  type,
  price,
  title,
  desc,
  canPayMobileMoney,
  operators,
}: {
  type: 'EXTRA_DEVICE' | 'WHITE_LABEL';
  price: number;
  title: string;
  desc: string;
  canPayMobileMoney: boolean;
  operators: Array<{ code: string; name: string }>;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const startAddonPayment = async (method: 'mobile_money' | 'card', operatorCode: string | null) => {
    setLoading(method === 'card' ? 'card' : (operatorCode ?? 'mobile_money'));
    try {
      const res = await fetch('/api/addons/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ type, method, operatorCode }),
      });
      if (!res.ok) {
        toast.show("Erreur lors de l'initialisation de l'extension", 'error');
        return;
      }
      const { authorizationUrl } = await res.json();
      window.location.href = authorizationUrl;
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
        <span className="shrink-0 rounded bg-sage-50 px-2 py-1 text-xs font-bold text-sage-800">
          +{price.toLocaleString('fr-FR')} FCFA/mois
        </span>
      </div>

      <div className="space-y-1.5 pt-1">
        {canPayMobileMoney ? (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {operators.map((op) => (
              <Button
                key={op.code}
                size="sm"
                variant="outline"
                onClick={() => startAddonPayment('mobile_money', op.code)}
                isLoading={loading === op.code}
              >
                Activer via {op.name}
              </Button>
            ))}
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            fullWidth
            onClick={() => startAddonPayment('card', null)}
            isLoading={loading === 'card'}
          >
            Activer par carte
          </Button>
        )}
      </div>
    </Card>
  );
}
