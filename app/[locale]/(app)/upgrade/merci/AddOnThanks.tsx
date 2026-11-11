'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Status = {
  ready: boolean;
  addOnType: 'EXTRA_DEVICE' | 'CUSTOM_WHATSAPP' | 'WHITE_LABEL' | null;
  invoiceNumber: string | null;
};

const MAX_POLLS = 30; // ~60 s : le webhook de Notch Pay arrive en général en quelques secondes

function addOnName(type: Status['addOnType'], fr: boolean): string {
  if (type === 'EXTRA_DEVICE') return fr ? 'Appareil supplémentaire' : 'Extra device';
  if (type === 'CUSTOM_WHATSAPP') return fr ? 'WhatsApp personnalisé' : 'Custom WhatsApp';
  if (type === 'WHITE_LABEL') return fr ? 'Marque blanche' : 'White label';
  return fr ? 'Add-on' : 'Add-on';
}

export function AddOnThanks({ locale, subscriptionId }: { locale: string; subscriptionId: string | null }) {
  const fr = locale !== 'en';
  const [status, setStatus] = useState<Status | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Le retour du paiement ne doit pas rester dans l'historique : on retire l'identifiant de l'URL.
    window.history.replaceState(null, '', window.location.pathname);
    if (!subscriptionId) {
      setTimedOut(true); // pas d'identifiant : on affiche le message neutre
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

  const ready = status?.ready === true;

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
                ? `Votre add-on « ${addOnName(status?.addOnType ?? null, true)} » est activé.`
                : `Your « ${addOnName(status?.addOnType ?? null, false)} » add-on is active.`}
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
        </>
      ) : timedOut ? (
        <>
          <h1 className="text-xl font-bold text-slate-900">{fr ? 'Paiement reçu' : 'Payment received'}</h1>
          <p className="text-sm text-slate-600">
            {fr
              ? 'Votre add-on est en cours d’activation. Votre facture apparaîtra dans Abonnements › Factures dans quelques instants.'
              : 'Your add-on is being activated. Your invoice will appear under Subscriptions › Invoices shortly.'}
          </p>
        </>
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-600">
            {fr ? 'Nous confirmons votre paiement…' : 'Confirming your payment…'}
          </p>
        </>
      )}

      <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row">
        <Link href={`/${locale}/subscriptions` as Route} className="flex-1">
          <Button fullWidth variant="secondary">
            {fr ? 'Voir mes factures' : 'View my invoices'}
          </Button>
        </Link>
        <Link href={`/${locale}/dashboard` as Route} className="flex-1">
          <Button fullWidth>{fr ? 'Retour au tableau de bord' : 'Back to dashboard'}</Button>
        </Link>
      </div>
    </div>
  );
}
