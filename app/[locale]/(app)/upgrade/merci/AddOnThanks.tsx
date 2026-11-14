'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, FileText, Loader2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Status = {
  ready: boolean;
  addOnType: 'EXTRA_DEVICE' | 'CUSTOM_WHATSAPP' | 'WHITE_LABEL' | null;
  invoiceNumber: string | null;
};

const MAX_POLLS = 25; // ~50 s

function addOnName(type: Status['addOnType'], fr: boolean): string {
  if (type === 'EXTRA_DEVICE') return fr ? 'Appareil supplémentaire' : 'Extra device';
  if (type === 'CUSTOM_WHATSAPP') return fr ? 'WhatsApp personnalisé' : 'Custom WhatsApp';
  if (type === 'WHITE_LABEL') return fr ? 'Marque blanche' : 'White label';
  return fr ? 'Extension' : 'Add-on';
}

export function AddOnThanks({ locale, subscriptionId }: { locale: string; subscriptionId: string | null }) {
  const fr = locale !== 'en';
  const [status, setStatus] = useState<Status | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [urlStatus, setUrlStatus] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier les paramètres renvoyés par Notch Pay avant d'épurer l'URL
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const s = (sp.get('status') || '').toLowerCase().trim();
      if (s) setUrlStatus(s);
      window.history.replaceState(null, '', window.location.pathname);
    }

    if (!subscriptionId) {
      setTimedOut(true);
      return;
    }

    let polls = 0;
    let cancelled = false;
    const tick = async () => {
      polls += 1;
      try {
        const res = await fetch(`/api/addons/status?subscriptionId=${encodeURIComponent(subscriptionId)}`);
        if (res.ok) {
          const data = (await res.json()) as Status;
          if (!cancelled) setStatus(data);
          if (data.ready) return;
        }
      } catch {}
      if (polls >= MAX_POLLS) {
        if (!cancelled) setTimedOut(true);
        return;
      }
      if (!cancelled) setTimeout(tick, 2000);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [subscriptionId]);

  const isCanceled = urlStatus === 'canceled' || urlStatus === 'cancelled';
  const isFailed = urlStatus === 'failed' || urlStatus === 'declined' || urlStatus === 'expired';
  const ready = status?.ready === true;

  if (isCanceled) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
          <XCircle className="h-9 w-9" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {fr ? 'Paiement interrompu' : 'Payment cancelled'}
          </h1>
          <p className="text-sm text-slate-600">
            {fr
              ? 'Vous avez annulé la procédure de paiement de votre extension. Aucun montant n’a été débité de votre compte.'
              : 'You cancelled the add-on payment process. No funds were debited from your account.'}
          </p>
        </div>
        <Link href={`/${locale}/upgrade` as Route}>
          <Button variant="primary">{fr ? 'Retour aux extensions' : 'Back to add-ons'}</Button>
        </Link>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
          <XCircle className="h-9 w-9" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {fr ? 'Échec du paiement' : 'Payment failed'}
          </h1>
          <p className="text-sm text-slate-600">
            {fr
              ? 'La transaction n’a pas abouti (délai dépassé ou refus de l’opérateur). Aucun montant n’a été prélevé.'
              : 'The transaction could not be processed. No funds were debited from your account.'}
          </p>
        </div>
        <Link href={`/${locale}/upgrade` as Route}>
          <Button variant="primary">{fr ? 'Réessayer le paiement' : 'Retry payment'}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
      {ready ? (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {fr ? 'Félicitations !' : 'Congratulations!'}
            </h1>
            <p className="text-sm text-slate-600">
              {fr
                ? `Votre extension « ${addOnName(status?.addOnType ?? null, true)} » est activée avec succès.`
                : `Your « ${addOnName(status?.addOnType ?? null, false)} » add-on is now active.`}
            </p>
          </div>
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-emerald-600" />
              {fr ? 'Votre facture est disponible' : 'Your invoice is available'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {fr ? 'Retrouvez-la dans ' : 'Find it in '}
              <span className="font-semibold text-slate-700">
                {fr ? 'Abonnements › Factures' : 'Subscriptions › Invoices'}
              </span>
              {status?.invoiceNumber ? ` · ${status.invoiceNumber}` : ''}
            </p>
          </div>
          <Link href={`/${locale}/dashboard` as Route}>
            <Button variant="primary">{fr ? 'Accéder à mon espace' : 'Go to workspace'}</Button>
          </Link>
        </>
      ) : timedOut ? (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
            <Clock className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            {fr ? 'En attente de confirmation de l’opérateur' : 'Waiting for operator confirmation'}
          </h1>
          <p className="text-sm text-slate-600">
            {fr
              ? 'Le paiement n’a pas encore été notifié par votre opérateur. Si vous avez validé le débit sur votre téléphone, votre extension s’activera automatiquement dès réception. Si vous aviez abandonné le paiement, aucun montant n’a été prélevé.'
              : 'Payment confirmation has not yet been received from your operator. If you approved the charge on your phone, your add-on will activate automatically as soon as it arrives. If you aborted, no funds were debited.'}
          </p>
          <Link href={`/${locale}/upgrade` as Route}>
            <Button variant="outline">{fr ? 'Retour aux extensions' : 'Back to add-ons'}</Button>
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-600">
            {fr ? 'Confirmation de votre paiement en cours…' : 'Confirming your payment…'}
          </p>
        </>
      )}
    </div>
  );
}
