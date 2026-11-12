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
import { PaymentBadges } from '@/components/ui/PaymentBadges';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { AdminTestProToggle } from '@/components/admin/AdminTestProToggle';
import { ProPlanPicker } from '@/components/pricing/ProPlanPicker';
import { DEFAULT_PRO_PLAN_ID, type ProPlanId } from '@/lib/pricing/plans';
import { ADDON_PRICES } from '@/lib/addons/queries';
import { ChevronRight, Gift } from 'lucide-react';
import { InfoTip } from '@/components/ui/InfoTip';

export default function UpgradePage() {
  const locale = useLocale();
  const t = useTranslations('upgrade');
  const tAddons = useTranslations('addons');
  const toast = useToast();
  const search = useSearchParams();
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ proUntil: string | null; role: string } | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<ProPlanId>(DEFAULT_PRO_PLAN_ID);

  const isConsumer = user?.accountType === 'CONSUMER';

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

  const startPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ method: 'auto', plan: selectedPlan }),
      });
      if (!res.ok) {
        toast.show("Erreur lors de l'initialisation du paiement", 'error');
        return;
      }
      const { authorizationUrl } = await res.json();
      window.location.href = authorizationUrl;
    } finally {
      setLoading(false);
    }
  };

  const proUntil = status?.proUntil;
  const isActive = proUntil && new Date(proUntil) > new Date();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Passer Pro</h1>
        <p className="mt-1 text-sm text-slate-500">
          {locale === 'fr'
            ? 'Choisissez la durée qui vous convient. Plus long = moins cher par mois.'
            : 'Choose the period that suits you. Longer = cheaper per month.'}
        </p>
      </div>

      {user?.role === 'ADMIN' && (
        <Card className="mb-4 border-amber-300 bg-amber-50/70 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                🛠️ Mode Test Administrateur
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                En tant qu&apos;administrateur, vous pouvez basculer instantanément votre compte en Pro pour tester l&apos;application sans passer par le paiement.
              </p>
            </div>
            <AdminTestProToggle />
          </div>
        </Card>
      )}

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

      <div className="my-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-center">
        <p className="mb-2.5 text-xs font-medium text-slate-600">
          {locale === 'fr'
            ? 'Moyens de paiement pris en charge par Notch Pay selon votre pays'
            : 'Payment methods supported by Notch Pay depending on your country'}
        </p>
        <PaymentBadges />
      </div>

      <section className="mb-5 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{locale === 'fr' ? 'Formules Pro' : 'Pro plans'}</h2>
          <p className="text-xs text-slate-500">
            {locale === 'fr'
              ? 'Plus la durée est longue, moins Pro coûte par mois.'
              : 'The longer the period, the less Pro costs per month.'}
          </p>
        </div>
        <ProPlanPicker locale={locale} selected={selectedPlan} onSelect={setSelectedPlan} />
      </section>

      <div className="space-y-2">
        <Button
          fullWidth
          size="lg"
          onClick={startPayment}
          isLoading={loading}
        >
          {locale === 'fr' ? 'Passer Pro' : 'Upgrade to Pro'}
        </Button>
        <p className="text-center text-[11px] text-slate-400 pt-1">
          🔒 {locale === 'fr'
            ? 'Paiement traité et sécurisé par Notch Pay (l’option disponible dans votre pays s’affiche automatiquement)'
            : 'Payment processed and secured by Notch Pay (available options for your country appear automatically)'}
        </p>
      </div>

      {/* Parrainage : même style de carte que les formules, placé après le paiement */}
      <section className="mt-10 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{locale === 'fr' ? 'Parrainage' : 'Referral'}</h2>
          <p className="text-xs text-slate-500">
            {locale === 'fr'
              ? 'Invitez un ami et gagnez des jours Pro offerts.'
              : 'Invite a friend and earn free Pro days.'}
          </p>
        </div>
      <Link
        href={'/referrals' as Route}
        className="group flex items-center gap-3 rounded-card border border-slate-200 bg-white p-4 shadow-card transition hover:border-sage-300 hover:shadow-card-hover active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
          <Gift className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">
            {locale === 'fr' ? 'Parrainez et gagnez 7 jours Pro' : 'Refer and earn 7 Pro days'}
          </span>
          <span className="block text-xs text-slate-600">
            {locale === 'fr'
              ? 'Pour chaque ami activé, vous recevez 7 jours Pro offerts.'
              : 'For each friend who activates, you get 7 free Pro days.'}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-sage-700 transition group-hover:translate-x-0.5" />
      </Link>
      </section>

      {user?.proUntil && new Date(user.proUntil) > new Date() && (
        <div className="mt-10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{tAddons('title')}</h2>
            <span className="text-[11px] text-slate-500">
              {locale === 'fr'
                ? '💡 Survolez (PC) ou touchez ℹ️ (mobile) pour les détails'
                : '💡 Hover (PC) or tap ℹ️ (mobile) for details'}
            </span>
          </div>
          <AddOnCard
            type="EXTRA_DEVICE"
            price={ADDON_PRICES.EXTRA_DEVICE}
            title={tAddons('extraDevice')}
            desc={tAddons('extraDeviceDesc')}
            tooltip={tAddons('extraDeviceTooltip')}
            locale={locale}
          />
          <AddOnCard
            type="CUSTOM_WHATSAPP"
            price={ADDON_PRICES.CUSTOM_WHATSAPP}
            title={tAddons('customWhatsapp')}
            desc={tAddons('customWhatsappDesc')}
            tooltip={tAddons('customWhatsappTooltip')}
            locale={locale}
          />
          <AddOnCard
            type="WHITE_LABEL"
            price={ADDON_PRICES.WHITE_LABEL}
            title={tAddons('whiteLabel')}
            desc={tAddons('whiteLabelDesc')}
            tooltip={tAddons('whiteLabelTooltip')}
            locale={locale}
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
            'Non, aucun prélèvement automatique forcé. Vous payez la formule choisie (1 mois : 2 000 FCFA, 3 mois : 5 000 FCFA, 1 an : 18 000 FCFA) pour un accès Pro sans engagement. À la fin de la période, vous décidez vous-même si vous souhaitez renouveler.',
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
            'No forced automatic recurring billing. You pay the plan you choose (1 month: 2,000 FCFA, 3 months: 5,000 FCFA, 1 year: 18,000 FCFA) for Pro access with zero commitment. You decide when and if you wish to renew.',
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
  tooltip,
  locale,
}: {
  type: 'EXTRA_DEVICE' | 'CUSTOM_WHATSAPP' | 'WHITE_LABEL';
  price: number;
  title: string;
  desc: string;
  tooltip: string;
  locale: string;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const startAddonPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/addons/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ type, method: 'auto' }),
      });
      if (!res.ok) {
        toast.show("Erreur lors de l'initialisation de l'extension", 'error');
        return;
      }
      const { authorizationUrl } = await res.json();
      window.location.href = authorizationUrl;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="group relative p-4 space-y-3 transition hover:border-emerald-300">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <InfoTip
              id={`addon-tip-${type}`}
              label={locale === 'fr' ? 'Explication' : 'How it works'}
              title={locale === 'fr' ? 'Comment ça marche' : 'How it works'}
            >
              <p>{tooltip}</p>
            </InfoTip>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
        <span className="shrink-0 rounded bg-sage-50 px-2 py-1 text-xs font-bold text-sage-800">
          +{price.toLocaleString('fr-FR')} FCFA/mois
        </span>
      </div>

      <div className="pt-1">
        <Button
          size="lg"
          fullWidth
          onClick={startAddonPayment}
          isLoading={loading}
        >
          {locale === 'fr' ? 'Activer' : 'Activate'}
        </Button>
      </div>
    </Card>
  );
}
