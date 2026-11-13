'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, MessageCircle, Smartphone, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InfoTip } from '@/components/ui/InfoTip';
import { useOnlineStatus } from '@/lib/device/network';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro } from '@/lib/auth/plan';

type ClientItem = { id: string; name: string; phone: string | null };
type Result = { clientId: string; clientName: string; status: 'SENT' | 'FAILED'; number?: string; error?: string };
type Summary = { total: number; success: number; fail: number; aborted: string | null; xmlFail?: number; results: Result[] };

const MAX = 30;

const ERROR_TEXT: Record<string, { fr: string; en: string }> = {
  NOT_CONFIGURED: {
    fr: "L'envoi WhatsApp n'est pas configuré sur le serveur.",
    en: 'WhatsApp sending is not configured on the server.',
  },
  PERSONAL_NOT_CONNECTED: {
    fr: "Votre numéro WhatsApp personnel n'est pas connecté. L'envoi a été arrêté.",
    en: 'Your personal WhatsApp number is not connected. Sending was stopped.',
  },
  GATEWAY_ERROR: { fr: "Échec de l'envoi WhatsApp.", en: 'WhatsApp sending failed.' },
  NO_INSTANCE_FOUND: { fr: 'Aucune instance WhatsApp disponible.', en: 'No WhatsApp instance available.' },
  INVALID_NUMBER: { fr: 'Numéro WhatsApp invalide.', en: 'Invalid WhatsApp number.' },
};

function errorLabel(code: string | undefined, fr: boolean): string {
  if (!code) return fr ? 'Erreur inconnue.' : 'Unknown error.';
  const hit = ERROR_TEXT[code];
  return hit ? (fr ? hit.fr : hit.en) : code;
}

export function BulkSendView({
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

  const [clients, setClients] = useState<ClientItem[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [personal, setPersonal] = useState(false);
  const [message, setMessage] = useState('');
  const [includeXml, setIncludeXml] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/clients')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setClients(Array.isArray(d.clients) ? d.clients : []))
      .catch(() => active && setClients([]));
    fetch('/api/addons/active')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && setPersonal(Boolean(d?.personalWhatsApp)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const withPhone = useMemo(() => (clients ?? []).filter((c) => c.phone && c.phone.trim().length > 0), [clients]);
  const withoutPhone = (clients ?? []).length - withPhone.length;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX ? prev : [...prev, id]));
  };

  const canSend = pro && online && !busy && selected.length > 0;

  const send = async () => {
    setError(null);
    if (!online) {
      setError(fr ? 'Connexion requise pour envoyer. Vous pouvez préparer le message hors ligne.' : 'Connection required to send.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ documentId, clientIds: selected, message: message.trim(), includeXml }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? (fr ? 'Envoi impossible.' : 'Sending failed.'));
        return;
      }
      setSummary(body as Summary);
    } catch {
      setError(fr ? 'Connexion interrompue. Vérifiez le résultat dans Historique.' : 'Connection lost. Check the result in History.');
    } finally {
      setBusy(false);
    }
  };

  if (summary) {
    const allOk = summary.fail === 0 && !summary.aborted;
    return (
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className={`flex h-16 w-16 items-center justify-center rounded-full ring-1 ${allOk ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 'bg-amber-50 text-amber-600 ring-amber-100'}`}>
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {allOk
              ? fr ? 'Envoi terminé' : 'Sending complete'
              : fr ? 'Envoi terminé avec des erreurs' : 'Sending finished with errors'}
          </h1>
          <p className="text-sm text-slate-600">
            {fr
              ? `${summary.success} envoyé(s) sur ${summary.total}.`
              : `${summary.success} sent out of ${summary.total}.`}
          </p>
          {summary.aborted && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorLabel(summary.aborted, fr)}
            </p>
          )}
          {includeXml && (summary.xmlFail ?? 0) > 0 && (
            <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {fr
                ? `Le PDF a été envoyé, mais le fichier XML n'a pas pu être joint pour ${summary.xmlFail} destinataire(s).`
                : `The PDF was sent, but the XML file could not be attached for ${summary.xmlFail} recipient(s).`}
            </p>
          )}
        </div>

        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {summary.results.map((r) => (
            <li key={r.clientId} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span className="truncate font-medium text-slate-900">{r.clientName}</span>
              {r.status === 'SENT' ? (
                <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" />{fr ? 'Envoyé' : 'Sent'}</span>
              ) : (
                <span className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" />{errorLabel(r.error, fr)}</span>
              )}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/${locale}/documents/${documentId}` as Route} className="flex-1">
            <Button fullWidth variant="secondary">{fr ? 'Retour au document' : 'Back to document'}</Button>
          </Link>
          <Link href={`/${locale}/history` as Route} className="flex-1">
            <Button fullWidth>{fr ? 'Voir l’historique' : 'View history'}</Button>
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
          <Users className="h-5 w-5 text-emerald-600" />
          {fr ? 'Envoi en masse' : 'Bulk send'} · {documentNumber}
        </h1>
        <p className="text-sm text-slate-500">
          {fr
            ? 'Choisissez les destinataires. Un document est créé pour chacun et envoyé par WhatsApp.'
            : 'Choose the recipients. A document is created for each and sent by WhatsApp.'}
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
            ? 'Vous êtes hors ligne. Vous pouvez préparer le message et la sélection, mais l’envoi exige une connexion.'
            : 'You are offline. You can prepare the message and selection, but sending requires a connection.'}
        </div>
      )}

      {/* Expéditeur : toujours explicite */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {personal ? <Smartphone className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-slate-900">
            {personal
              ? fr ? 'Envoi depuis votre numéro WhatsApp' : 'Sent from your WhatsApp number'
              : fr ? 'Envoi depuis MyCashBill' : 'Sent from MyCashBill'}
          </p>
          <p className="text-xs text-slate-500">
            {personal
              ? fr
                ? 'Les messages partent uniquement de votre numéro personnel.'
                : 'Messages are sent only from your personal number.'
              : fr
                ? 'Le message est signé de votre entreprise, avec la mention d’outil technique.'
                : 'The message is signed with your company name, with a technical tool notice.'}
          </p>
        </div>
        <InfoTip id="tip-bulk-sender" label={fr ? 'Infos' : 'Info'} title={fr ? 'Expéditeur' : 'Sender'}>
          <p>
            {fr
              ? 'Pour envoyer depuis votre propre numéro, activez l’option « Mon numéro WhatsApp » dans Extensions. Sans cette option, les envois partent de MyCashBill.'
              : 'To send from your own number, activate the « My WhatsApp number » add-on in Extensions. Without it, sending goes through MyCashBill.'}
          </p>
        </InfoTip>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-slate-800">
            {fr ? 'Destinataires' : 'Recipients'} · {selected.length}/{MAX}
          </p>
          <div className="flex gap-3 text-xs font-semibold">
            <button type="button" className="inline-flex min-h-11 items-center rounded-md px-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 sm:min-h-0 sm:px-1" onClick={() => setSelected(withPhone.slice(0, MAX).map((c) => c.id))}>
              {fr ? 'Tout' : 'All'}
            </button>
            <button type="button" className="inline-flex min-h-11 items-center rounded-md px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 sm:min-h-0 sm:px-1" onClick={() => setSelected([])}>
              {fr ? 'Aucun' : 'None'}
            </button>
          </div>
        </div>

        {clients === null ? (
          <p className="py-6 text-center text-sm text-slate-500">{fr ? 'Chargement…' : 'Loading…'}</p>
        ) : withPhone.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
            {fr ? 'Aucun client avec un numéro WhatsApp.' : 'No client with a WhatsApp number.'}
          </p>
        ) : (
          <ul role="group" aria-label={fr ? 'Destinataires' : 'Recipients'} className="grid gap-2">
            {withPhone.map((c) => {
              const on = selected.includes(c.id);
              const limited = !on && selected.length >= MAX;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    disabled={limited}
                    onClick={() => toggle(c.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition disabled:opacity-50 ${
                      on ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${on ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                      {on && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{c.name}</span>
                      <span className="block truncate text-xs text-slate-500">{c.phone}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {withoutPhone > 0 && (
          <p className="text-xs text-slate-500">
            {fr
              ? `${withoutPhone} client(s) sans numéro WhatsApp ne sont pas proposés.`
              : `${withoutPhone} client(s) without a WhatsApp number are not listed.`}
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <label htmlFor="bulk-message" className="block text-[13px] font-medium text-slate-700">
          {fr ? 'Message (facultatif)' : 'Message (optional)'}
        </label>
        <textarea
          id="bulk-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder={fr ? 'Ajoutez un mot pour vos clients…' : 'Add a note for your clients…'}
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[16px] sm:text-sm text-ink focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeXml}
            onChange={(e) => setIncludeXml(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>
            <span className="block font-semibold text-slate-900">
              {fr ? 'Joindre aussi le fichier XML' : 'Also attach the XML file'}
            </span>
            <span className="block text-xs text-slate-500">
              {fr
                ? 'Envoyé juste après chaque PDF, lisible par les logiciels de comptabilité.'
                : 'Sent right after each PDF, readable by accounting software.'}
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="sticky bottom-20 md:bottom-4">
        <Button type="button" fullWidth size="lg" className="min-h-12 shadow-lg" onClick={send} disabled={!canSend} isLoading={busy}>
          {selected.length > 0
            ? fr ? `Envoyer à ${selected.length} destinataire(s)` : `Send to ${selected.length} recipient(s)`
            : fr ? 'Sélectionnez des destinataires' : 'Select recipients'}
        </Button>
      </div>
    </div>
  );
}
