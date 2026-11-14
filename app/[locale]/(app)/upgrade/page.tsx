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
import { ChevronRight, Gift, CheckCircle2, AlertCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { InfoTip } from '@/components/ui/InfoTip';

type PaymentFeedback =
  | { type: 'canceled' }
  | { type: 'failed'; message?: string }
  | { type: 'verifying'; pollCount: number }
  | { type: 'success'; endsAt: string; invoiceNumber: string | null }
  | { type: 'pending_timeout' };

export default function UpgradePage() {
  const locale = useLocale();
  const fr = locale !== 'en';
  const t = useTranslations('upgrade');
  const tAddons = useTranslations('addons');
  const toast = useToast();
  const search = useSearchParams();
  const { user, refresh } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ proUntil: string | null; role: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ProPlanId>(DEFAULT_PRO_PLAN_ID);
  const [feedback, setFeedback] = useState<PaymentFeedback | null>(null);

  const isConsumer = user?.accountType === 'CONSUMER';

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

  // Détection précise du retour Notch Pay (URL callback)
  const rawRef = search.get('ref') || search.get('reference');
  const rawStatus = (search.get('status') || '').toLowerCase().trim();

  useEffect(() => {
    if (!rawRef && !rawStatus) return;

    // Nettoie les paramètres de l'URL pour un affichage propre
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 1. Annulation explicite de l'utilisateur
    if (rawStatus === 'canceled' || rawStatus === 'cancelled') {
      setFeedback({ type: 'canceled' });
      return;
    }

    // 2. Échec direct
    if (rawStatus === 'failed' || rawStatus === 'declined' || rawStatus === 'expired') {
      setFeedback({ type: 'failed' });
      return;
    }

    // 3. Vérification de la transaction précise auprès du serveur
    if (rawRef) {
      setFeedback({ type: 'verifying', pollCount: 0 });
      let count = 0;
      let cancelled = false;

      const checkTransaction = async () => {
        count += 1;
        try {
          const res = await fetch(`/api/payments/status?ref=${encodeURIComponent(rawRef)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'COMPLETED') {
              if (!cancelled) {
                setFeedback({
                  type: 'success',
                  endsAt: data.endsAt,
                  invoiceNumber: data.invoiceNumber ?? null,
                });
                await refresh();
              }
              return;
            }
            if (data.status === 'FAILED') {
              if (!cancelled) {
                setFeedback({ type: 'failed' });
              }
              return;
            }
          }
        } catch {}

        if (count >= 18) {
          if (!cancelled) {
            setFeedback({ type: 'pending_timeout' });
          }
          return;
        }

        if (!cancelled) {
          setFeedback({ type: 'verifying', pollCount: count });
          setTimeout(checkTransaction, 2500);
        }
      };

      checkTransaction();
      return () => {
        cancelled = true;
      };
    }
  }, [rawRef, rawStatus, refresh]);

  const startPayment = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          method: 'auto',
          plan: selectedPlan,
          locale: locale === 'en' ? 'en' : 'fr',
        }),
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {fr ? 'Passer Pro' : 'Upgrade to Pro'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {fr
            ? 'Choisissez la durée qui vous convient. Plus long = moins cher par mois.'
            : 'Choose the period that suits you. Longer = cheaper per month.'}
        </p>
      </div>

      {/* NOTIFICATIONS CLAIRES DE RETOUR DE PAIEMENT */}
      {feedback?.type === 'canceled' && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
              <XCircle className="h-5 w-5" />
            </span>
            <div className="space-y-1 flex-1">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                {fr ? 'Paiement interrompu' : 'Payment cancelled'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {fr
                  ? 'Vous avez annulé la procédure de paiement. Aucun montant n’a été prélevé sur votre compte. Vos documents et votre compte restent intacts. Vous pouvez souscrire quand vous le souhaitez.'
                  : 'You cancelled the payment process. No funds were debited from your account. Your documents and data remain available, and you can upgrade whenever you are ready.'}
              </p>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="pt-1.5 text-xs font-semibold text-slate-700 underline hover:text-slate-900 block"
              >
                {fr ? 'Fermer cette notification' : 'Dismiss notice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback?.type === 'failed' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div className="space-y-1 flex-1">
              <h2 className="font-bold text-red-900 text-sm sm:text-base">
                {fr ? 'Échec de la transaction' : 'Transaction failed'}
              </h2>
              <p className="text-xs text-red-700 leading-relaxed">
                {fr
                  ? 'La transaction n’a pas abouti (délai d’autorisation dépassé sur votre téléphone ou solde insuffisant). Aucun prélèvement n’a été effectué.'
                  : 'The transaction could not be completed (authorization timed out on your phone or insufficient funds). No funds were debited.'}
              </p>
              <div className="pt-2 flex items-center gap-3">
                <Button size="sm" onClick={() => startPayment()} disabled={loading} loading={loading}>
                  {fr ? 'Réessayer le paiement' : 'Retry payment'}
                </Button>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="text-xs text-red-700 hover:text-red-900 underline"
                >
                  {fr ? 'Fermer' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {feedback?.type === 'verifying' && (
        <Card className="p-4 sm:p-5 border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-900">
                {fr ? 'Confirmation du paiement en cours…' : 'Confirming payment…'}
              </p>
              <p className="text-xs text-slate-600">
                {fr
                  ? 'Veuillez valider le débit avec votre code secret sur votre téléphone si ce n’est pas encore fait.'
                  : 'Please confirm the prompt with your secret PIN on your phone if not already done.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {feedback?.type === 'pending_timeout' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Clock className="h-5 w-5" />
            </span>
            <div className="space-y-1 flex-1">
              <h2 className="font-bold text-amber-950 text-sm">
                {fr ? 'En attente de notification de l’opérateur' : 'Waiting for operator confirmation'}
              </h2>
              <p className="text-xs text-amber-800 leading-relaxed">
                {fr
                  ? 'Le paiement n’a pas encore été confirmé par votre opérateur. Si vous avez validé le débit sur votre téléphone, votre compte s’activera automatiquement dès réception. Si vous aviez abandonné le paiement, aucun montant n’a été prélevé.'
                  : 'The payment has not been confirmed by your operator yet. If you approved the charge on your phone, your account will activate automatically as soon as it arrives. If you aborted, no funds were debited.'}
              </p>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="pt-1.5 text-xs text-amber-800 hover:text-amber-950 underline block"
              >
                {fr ? 'Fermer' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback?.type === 'success' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div className="space-y-1 flex-1 min-w-0">
              <h2 className="font-extrabold text-emerald-950 text-base sm:text-lg">
                {fr ? '🎉 Félicitations ! Votre abonnement Pro est actif' : '🎉 Congratulations! Your Pro plan is active'}
              </h2>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {fr
                  ? `Votre paiement a été validé avec succès. Votre statut Pro est actif jusqu’au ${new Date(feedback.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                  : `Your payment was confirmed. Your Pro status is active until ${new Date(feedback.endsAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
              </p>
              {feedback.invoiceNumber && (
                <p className="text-[11px] font-semibold text-emerald-700 pt-0.5">
                  {fr ? `Facture officielle n° ${feedback.invoiceNumber} disponible dans vos abonnements.` : `Official invoice #${feedback.invoiceNumber} available under subscriptions.`}
                </p>
              )}
              <div className="pt-3 flex items-center gap-2 flex-wrap">
                <Link href={`/${locale}/documents/new` as Route}>
                  <Button size="sm" variant="primary">
                    {fr ? 'Créer un document Pro' : 'Create a Pro invoice'}
                  </Button>
                </Link>
                <Link href={`/${locale}/subscriptions` as Route}>
                  <Button size="sm" variant="outline">
                    {fr ? 'Voir mes factures' : 'View my invoices'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li>✓ {t('featureNoWatermark')}</li>
          <li>✓ {t('featureLogo')}</li>
          <li className="text-emerald-700 font-semibold">
            ✓ {fr ? 'Liaison de votre propre numéro WhatsApp incluse' : 'Personal WhatsApp number included'}
          </li>
          <li>✓ {t('featureUnlimitedClients')}</li>
          <li>✓ {t('featureUnlimitedHistory')}</li>
          <li>✓ {t('feature2Devices')}</li>
          <li>✓ {fr ? 'PDF + fichier XML lisible par vos logiciels' : 'PDF + XML file readable by your software'}</li>
        </ul>
      </Card>

      {isConsumer && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">
            {fr
              ? 'Compte particulier. En souscrivant, vous confirmez la renonciation à votre droit de rétractation acceptée lors de votre inscription. Aucun remboursement après paiement.'
              : 'Individual account. By subscribing, you confirm the withdrawal waiver accepted at registration. No refund after payment.'}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-center">
        <p className="mb-2.5 text-xs font-medium text-slate-600">
          {fr
            ? 'Moyens de paiement pris en charge par Notch Pay selon votre pays'
            : 'Payment methods supported by Notch Pay depending on your country'}
        </p>
        <PaymentBadges />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{fr ? 'Formules Pro' : 'Pro plans'}</h2>
          <p className="text-xs text-slate-500">
            {fr
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
          {fr ? 'Passer Pro' : 'Upgrade to Pro'}
        </Button>
        <p className="text-center text-[11px] text-slate-400 pt-1">
          🔒 {fr
            ? 'Paiement traité et sécurisé par Notch Pay (l’option disponible dans votre pays s’affiche automatiquement)'
            : 'Payment processed and secured by Notch Pay (available options for your country appear automatically)'}
        </p>
      </div>

      {/* Parrainage */}
      <section className="mt-8 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{fr ? 'Parrainage' : 'Referral'}</h2>
          <p className="text-xs text-slate-500">
            {fr
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
              {fr ? 'Parrainez et gagnez 7 jours Pro' : 'Refer and earn 7 Pro days'}
            </span>
            <span className="block text-xs text-slate-600">
              {fr
                ? 'Pour chaque ami activé, vous recevez 7 jours Pro offerts.'
                : 'For each friend who activates, you get 7 free Pro days.'}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-sage-700 transition group-hover:translate-x-0.5" />
        </Link>
      </section>

      {/* Extensions (Add-ons) */}
      {user?.proUntil && new Date(user.proUntil) > new Date() && (
        <div className="mt-10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{tAddons('title')}</h2>
            <span className="text-[11px] text-slate-500">
              {fr
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
            type="WHITE_LABEL"
            price={ADDON_PRICES.WHITE_LABEL}
            title={tAddons('whiteLabel')}
            desc={tAddons('whiteLabelDesc')}
            tooltip={tAddons('whiteLabelTooltip')}
            locale={locale}
          />
        </div>
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
            'No forced recurring auto-debit. You pay for the chosen duration (1 month: 2,000 XAF, 3 months: 5,000 XAF, 1 year: 18,000 XAF) with zero commitment. At the end, you decide whether to renew.',
        },
        {
          id: 'faq-data',
          question: 'What happens to my data if my Pro plan expires?',
          answer:
            'All your records (saved clients, quotes, invoices) remain intact and accessible at any time. You simply fall back to the free plan with a watermark, with no data loss.',
        },
      ];

  const [entries, setEntries] = useState(defaultBillingEntries);

  useEffect(() => {
    fetch('/api/faq?category=BILLING')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEntries(
            data.map((item: any) => ({
              id: item.id,
              question: isFr ? item.questionFr : item.questionEn || item.questionFr,
              answer: isFr ? item.answerFr : item.answerEn || item.answerFr,
            }))
          );
        }
      })
      .catch(() => {});
  }, [locale, isFr]);

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
        body: JSON.stringify({
          type,
          method: 'auto',
          locale: locale === 'en' ? 'en' : 'fr',
        }),
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
