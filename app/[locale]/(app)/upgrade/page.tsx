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
import { ChevronRight, Gift, CheckCircle2, AlertCircle, XCircle, Clock, Loader2, ShieldCheck } from 'lucide-react';
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
  const [status, setStatus] = useState<{
    proUntil: string | null;
    role: string;
    hasPaidPro?: boolean;
    isInTrial?: boolean;
  } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ProPlanId>(DEFAULT_PRO_PLAN_ID);
  const [feedback, setFeedback] = useState<PaymentFeedback | null>(null);

  // Modale de redirection & réassurance Kinstill
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTargetName, setModalTargetName] = useState('');
  const [modalReadyUrl, setModalReadyUrl] = useState<string | null>(null);
  const [modalProgress, setModalProgress] = useState(0);

  const isConsumer = user?.accountType === 'CONSUMER';
  const hasPaidPro = Boolean(
    status?.hasPaidPro || user?.role === 'ADMIN' || user?.role === 'SUPPORT'
  );

  // Timer de transition pour la modale (2,8 secondes)
  useEffect(() => {
    if (!modalOpen) return;
    const startTime = Date.now();
    const duration = 2800;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setModalProgress(pct);

      if (elapsed >= duration && modalReadyUrl) {
        clearInterval(interval);
        window.location.href = modalReadyUrl;
      }
    }, 80);

    return () => clearInterval(interval);
  }, [modalOpen, modalReadyUrl]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setStatus({
            proUntil: d.user.proUntil,
            role: d.user.role,
            hasPaidPro: Boolean(d.user.hasPaidPro),
            isInTrial: Boolean(d.user.isInTrial),
          });
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
    setFeedback(null);
    setModalTargetName(fr ? 'votre forfait Pro' : 'your Pro plan');
    setModalReadyUrl(null);
    setModalProgress(0);
    setModalOpen(true);

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
        setModalOpen(false);
        return;
      }
      const { authorizationUrl } = await res.json();
      setModalReadyUrl(authorizationUrl);
    } catch {
      toast.show("Erreur réseau lors de l'initialisation", 'error');
      setModalOpen(false);
    }
  };

  const startAddonPayment = async (type: 'EXTRA_DEVICE' | 'CUSTOM_WHATSAPP' | 'WHITE_LABEL', title: string) => {
    setFeedback(null);
    setModalTargetName(title);
    setModalReadyUrl(null);
    setModalProgress(0);
    setModalOpen(true);

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
        const errData = await res.json().catch(() => ({}));
        toast.show(errData.error?.message || "Erreur lors de l'initialisation de l'extension", 'error');
        setModalOpen(false);
        return;
      }
      const { authorizationUrl } = await res.json();
      setModalReadyUrl(authorizationUrl);
    } catch {
      toast.show("Erreur réseau lors de l'initialisation", 'error');
      setModalOpen(false);
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
                {fr
                  ? 'Vous êtes bien de retour sur MyCashBill (Kinstill)'
                  : 'You are back on MyCashBill (Kinstill)'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {fr
                  ? 'Vous avez cliqué sur « Retour sur Kinstill ». La procédure de paiement sur la passerelle a été interrompue et aucun montant n’a été débité de votre compte. Vos données restent intactes et vous pouvez reprendre quand vous le souhaitez.'
                  : 'You clicked "Return to Kinstill". The payment process was interrupted and no funds were debited from your account. Your documents and data remain intact, and you can upgrade whenever you are ready.'}
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
                {fr ? '🎉 Félicitations ! Votre abonnement Pro MyCashBill est actif' : '🎉 Congratulations! Your MyCashBill Pro plan is active'}
              </h2>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {fr
                  ? `Votre paiement sécurisé traité par Kinstill via Notch Pay a été validé avec succès. Votre statut Pro est actif jusqu’au ${new Date(feedback.endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                  : `Your secure payment processed by Kinstill via Notch Pay was confirmed. Your Pro status is active until ${new Date(feedback.endsAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
              </p>
              {feedback.invoiceNumber && (
                <p className="text-[11px] font-semibold text-emerald-700 pt-0.5">
                  {fr ? `Facture officielle n° ${feedback.invoiceNumber} (émise par Kinstill) disponible dans vos abonnements.` : `Official invoice #${feedback.invoiceNumber} (issued by Kinstill) available under subscriptions.`}
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
        <p className="text-center text-[11px] text-slate-500 pt-1">
          🔒 {fr
            ? 'Paiement sécurisé par Notch Pay • Bénéficiaire officiel : Kinstill (MyCashBill)'
            : 'Payment secured by Notch Pay • Official merchant: Kinstill (MyCashBill)'}
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
      <div className="mt-10 space-y-3" id="addons-section">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{tAddons('title')}</h2>
          <span className="text-[11px] text-slate-500">
            {fr
              ? '💡 Survolez (PC) ou touchez ℹ️ (mobile) pour les détails'
              : '💡 Hover (PC) or tap ℹ️ (mobile) for details'}
          </span>
        </div>

        {!hasPaidPro && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">
                {fr
                  ? '🔒 Réservé aux abonnés Pro payants'
                  : '🔒 Reserved for paid Pro subscribers'}
              </p>
              <p className="text-amber-800/90 leading-relaxed">
                {fr
                  ? "Les extensions (Appareil supplémentaire, Marque blanche) nécessitent un abonnement Pro actif. Les comptes gratuits ou en période d'essai doivent d'abord activer une formule Pro ci-dessus pour y souscrire."
                  : 'Add-ons (Extra device, White label) require an active Pro subscription. Free accounts or accounts in trial must first activate a Pro plan above to subscribe.'}
              </p>
            </div>
          </div>
        )}

        <AddOnCard
          type="EXTRA_DEVICE"
          price={ADDON_PRICES.EXTRA_DEVICE}
          title={tAddons('extraDevice')}
          desc={tAddons('extraDeviceDesc')}
          tooltip={tAddons('extraDeviceTooltip')}
          locale={locale}
          locked={!hasPaidPro}
          onStartPayment={(type, title) => startAddonPayment(type, title)}
        />
        <AddOnCard
          type="WHITE_LABEL"
          price={ADDON_PRICES.WHITE_LABEL}
          title={tAddons('whiteLabel')}
          desc={tAddons('whiteLabelDesc')}
          tooltip={tAddons('whiteLabelTooltip')}
          locale={locale}
          locked={!hasPaidPro}
          onStartPayment={(type, title) => startAddonPayment(type, title)}
        />
      </div>

      {/* MODALE DE TRANSITION & RÉASSURANCE KINSTILL / NOTCH PAY */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 text-center">
            {/* Header badges */}
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
                <ShieldCheck className="h-7 w-7" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                <span>MyCashBill</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700 font-bold">Kinstill</span>
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {fr ? 'Redirection vers Notch Pay...' : 'Redirecting to Notch Pay...'}
              </h3>
              <p className="text-xs text-slate-500">
                {fr ? `Préparation pour ${modalTargetName}` : `Preparing for ${modalTargetName}`}
              </p>
            </div>

            {/* Note explicative brève et rassurante */}
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 p-3.5 text-left text-xs text-amber-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <span>ℹ️</span>
                <span>{fr ? 'Bénéficiaire officiel : Kinstill' : 'Official merchant: Kinstill'}</span>
              </p>
              <p className="text-amber-900/90 leading-relaxed text-[11px] sm:text-xs">
                {fr
                  ? 'MyCashBill est édité par Kinstill. Sur la passerelle sécurisée Notch Pay et lors du retour (« Retour sur Kinstill »), le bénéficiaire affiché est donc légitimement Kinstill.'
                  : 'MyCashBill is published by Kinstill. On the secure Notch Pay gateway and upon return ("Return to Kinstill"), the official merchant displayed is legitimately Kinstill.'}
              </p>
            </div>

            {/* Barre de progression & Bouton d'accès */}
            <div className="space-y-2 pt-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150 ease-linear rounded-full"
                  style={{ width: `${modalProgress}%` }}
                />
              </div>

              {modalReadyUrl ? (
                <Button
                  size="md"
                  fullWidth
                  onClick={() => { window.location.href = modalReadyUrl; }}
                  className="mt-1"
                >
                  {fr ? 'Accéder au paiement maintenant →' : 'Proceed to payment now →'}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>{fr ? 'Génération de la session sécurisée...' : 'Securing your session...'}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 underline block mx-auto pt-1"
              >
                {fr ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          </div>
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
          id: 'faq-kinstill',
          question: 'Pourquoi le nom Kinstill apparaît-il sur Notch Pay ?',
          answer:
            'Kinstill est la maison mère éditrice de MyCashBill. C’est sous ce nom que notre compte marchand officiel est enregistré auprès de Notch Pay pour traiter vos paiements en toute sécurité.',
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
          id: 'faq-kinstill',
          question: 'Why does the name Kinstill appear on Notch Pay?',
          answer:
            'Kinstill is the parent company publishing MyCashBill. Our official certified merchant account with Notch Pay is registered under this name to process your payments securely.',
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
  locked,
  onStartPayment,
}: {
  type: 'EXTRA_DEVICE' | 'CUSTOM_WHATSAPP' | 'WHITE_LABEL';
  price: number;
  title: string;
  desc: string;
  tooltip: string;
  locale: string;
  locked?: boolean;
  onStartPayment?: (type: 'EXTRA_DEVICE' | 'CUSTOM_WHATSAPP' | 'WHITE_LABEL', title: string) => void;
}) {
  const toast = useToast();

  const handleAction = () => {
    if (locked) {
      toast.show(
        locale === 'fr'
          ? "Veuillez d'abord activer un forfait Pro pour débloquer cette extension."
          : 'Please activate a Pro plan first to unlock this add-on.',
        'info'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (onStartPayment) {
      onStartPayment(type, title);
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
        {locked ? (
          <Button
            size="lg"
            fullWidth
            variant="outline"
            className="border-dashed border-amber-300 text-amber-900 bg-amber-50/50 hover:bg-amber-100/60"
            onClick={handleAction}
          >
            🔒 {locale === 'fr' ? 'Nécessite le forfait Pro' : 'Requires Pro plan'}
          </Button>
        ) : (
          <Button
            size="lg"
            fullWidth
            onClick={handleAction}
          >
            {locale === 'fr' ? 'Activer' : 'Activate'}
          </Button>
        )}
      </div>
    </Card>
  );
}
