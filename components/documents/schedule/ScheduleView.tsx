'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InfoTip } from '@/components/ui/InfoTip';
import { useOnlineStatus } from '@/lib/device/network';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro } from '@/lib/auth/plan';

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const FREQUENCIES: { id: Frequency; fr: string; en: string }[] = [
  { id: 'DAILY', fr: 'Chaque jour', en: 'Every day' },
  { id: 'WEEKLY', fr: 'Chaque semaine', en: 'Every week' },
  { id: 'MONTHLY', fr: 'Chaque mois', en: 'Every month' },
];

export function ScheduleView({
  documentId,
  documentNumber,
  locale,
}: {
  documentId: string;
  documentNumber: string;
  locale: 'fr' | 'en';
}) {
  const fr = locale === 'fr';
  const online = useOnlineStatus();
  const { user } = useCurrentUser();
  const pro = user ? isPro(user) : false;

  const [label, setLabel] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');
  const [autoWhatsApp, setAutoWhatsApp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canSubmit = pro && online && !busy;

  const save = async () => {
    setError(null);
    if (!online) {
      setError(fr ? 'Connexion requise pour programmer. Votre brouillon reste disponible.' : 'Connection required to schedule.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          documentId,
          label: label.trim() || documentNumber,
          frequency,
          autoSendWhatsApp: autoWhatsApp,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? (fr ? 'Impossible de programmer ce document.' : 'Could not schedule this document.'));
        return;
      }
      setSaved(true);
    } catch {
      setError(fr ? 'Connexion interrompue. Réessayez.' : 'Connection lost. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {fr ? 'Programmation enregistrée' : 'Schedule saved'}
          </h1>
          <p className="text-sm text-slate-600">
            {fr
              ? 'Le document sera créé automatiquement à chaque échéance. Vous retrouvez la programmation dans Récurrents.'
              : 'The document will be created automatically at each due date. Find the schedule under Recurring.'}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row">
          <Link href={`/${locale}/documents/${documentId}` as Route} className="flex-1">
            <Button fullWidth variant="secondary">{fr ? 'Retour au document' : 'Back to document'}</Button>
          </Link>
          <Link href={`/${locale}/recurring` as Route} className="flex-1">
            <Button fullWidth>{fr ? 'Voir mes programmations' : 'View schedules'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="space-y-1">
        <Link href={`/${locale}/documents/${documentId}` as Route} className="text-xs font-medium text-slate-500 hover:text-slate-800">
          ← {fr ? 'Retour au document' : 'Back to document'}
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <CalendarClock className="h-5 w-5 text-emerald-600" />
          {fr ? 'Programmer' : 'Schedule'} {documentNumber}
        </h1>
        <p className="text-sm text-slate-500">
          {fr
            ? 'Créez ce document automatiquement à intervalle régulier.'
            : 'Create this document automatically at a regular interval.'}
        </p>
      </div>

      {!pro && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">{fr ? 'Réservé aux comptes Pro' : 'Pro accounts only'}</p>
          <Link href={`/${locale}/upgrade` as Route} className="mt-1 inline-block font-bold underline">
            {fr ? 'Passer Pro' : 'Go Pro'} →
          </Link>
        </div>
      )}

      {!online && (
        <div role="status" className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm text-slate-700">
          {fr
            ? 'Vous êtes hors ligne. Vous pouvez préparer la programmation, mais elle ne pourra être enregistrée qu’en ligne.'
            : 'You are offline. You can prepare the schedule, but it can only be saved online.'}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <Input
          id="schedule-label"
          label={fr ? 'Nom de la programmation (facultatif)' : 'Schedule name (optional)'}
          placeholder={documentNumber}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={!pro}
        />

        <div>
          <p className="mb-2 text-[13px] font-medium text-slate-700">{fr ? 'Fréquence' : 'Frequency'}</p>
          <div role="radiogroup" className="grid grid-cols-3 gap-2">
            {FREQUENCIES.map((f) => {
              const selected = frequency === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!pro}
                  onClick={() => setFrequency(f.id)}
                  className={`min-h-16 rounded-2xl border-2 p-2 text-center text-sm font-semibold transition disabled:opacity-60 ${
                    selected ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {fr ? f.fr : f.en}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <label className={`flex items-start gap-3 ${pro ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
              checked={autoWhatsApp}
              disabled={!pro}
              onChange={(e) => setAutoWhatsApp(e.target.checked)}
            />
            <span className="text-sm text-slate-700">
              {fr
                ? 'Envoyer automatiquement par WhatsApp à chaque échéance'
                : 'Send automatically by WhatsApp at each due date'}
            </span>
          </label>
          <div className="pl-7">
            <InfoTip
              id="tip-schedule-whatsapp"
              label={fr ? 'Comment ça marche' : 'How it works'}
              title={fr ? 'Envoi automatique' : 'Automatic sending'}
            >
              <p>
                {fr
                  ? 'Le document part sur WhatsApp au numéro enregistré pour le client, depuis l’instance MyCashBill ou votre numéro personnel si cette option est active.'
                  : 'The document is sent on WhatsApp to the client’s saved number, from the MyCashBill instance or your own number if that option is active.'}
              </p>
              <p>
                {fr
                  ? 'Sans numéro WhatsApp pour le client, le document est créé sans être envoyé.'
                  : 'Without a WhatsApp number for the client, the document is created but not sent.'}
              </p>
            </InfoTip>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button type="button" fullWidth size="lg" className="min-h-12" onClick={save} disabled={!canSubmit} isLoading={busy}>
          {fr ? 'Enregistrer la programmation' : 'Save schedule'}
        </Button>
      </div>
    </div>
  );
}
