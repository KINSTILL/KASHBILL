'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, Download, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { downloadBlob } from '@/lib/pdf/render';
import { useOnlineStatus } from '@/lib/device/network';
import type { PdfDocument } from '@/lib/pdf/types';

type Method = 'whatsapp' | 'download';

const METHODS: { id: Method; icon: typeof MessageCircle; fr: string; en: string }[] = [
  { id: 'whatsapp', icon: MessageCircle, fr: 'WhatsApp', en: 'WhatsApp' },
  { id: 'download', icon: Download, fr: 'Télécharger', en: 'Download' },
];

type Done = { method: Method; recipient: string | null };

export function SendDocumentView({
  documentId,
  pdfDoc,
  locale,
  docLabel,
  defaultPhone,
  clientName,
}: {
  documentId: string;
  pdfDoc: PdfDocument;
  locale: 'fr' | 'en';
  docLabel: string;
  defaultPhone: string;
  clientName: string | null;
}) {
  const fr = locale === 'fr';
  const online = useOnlineStatus();
  const [method, setMethod] = useState<Method>('whatsapp');
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState(
    fr
      ? `Bonjour${clientName ? ` ${clientName}` : ''}, veuillez trouver ci-joint ${docLabel.toLowerCase()} ${pdfDoc.number}. Merci pour votre confiance.`
      : `Hello${clientName ? ` ${clientName}` : ''}, please find attached ${docLabel.toLowerCase()} ${pdfDoc.number}. Thank you for your trust.`
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const fileName = `${pdfDoc.number}.pdf`;

  const markSent = async () => {
    try {
      await fetch(`/api/documents/${documentId}/mark-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      });
    } catch {}
  };

  // Le PDF est toujours généré par le serveur à partir du document enregistré
  const fetchPdf = async (): Promise<Blob> => {
    const res = await fetch(`/api/documents/${documentId}/pdf`, { headers: { 'X-Requested-With': 'fetch' } });
    if (!res.ok) throw new Error('pdf');
    return res.blob();
  };

  const submit = async () => {
    setError(null);
    if (method === 'download') {
      setBusy(true);
      try {
        downloadBlob(await fetchPdf(), fileName);
        await markSent();
        setDone({ method, recipient: null });
      } catch {
        setError(fr ? 'Téléchargement impossible. Vérifiez votre connexion.' : 'Download failed. Check your connection.');
      } finally {
        setBusy(false);
      }
      return;
    }

    // WhatsApp : envoi réseau obligatoire
    if (!online) {
      setError(fr ? 'Connexion requise pour envoyer. Le document reste prêt dans votre brouillon.' : 'Connection required to send.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 6) {
      setError(fr ? 'Saisissez un numéro WhatsApp valide.' : 'Enter a valid WhatsApp number.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ phone: phone.trim(), message, filename: fileName, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? (fr ? 'Envoi impossible.' : 'Sending failed.'));
        return;
      }
      if (!data?.sentDirect) {
        setError(
          fr
            ? "L'envoi WhatsApp n'a pas abouti. Réessayez ou téléchargez le PDF."
            : 'WhatsApp sending did not complete. Try again or download the PDF.'
        );
        return;
      }
      setDone({ method, recipient: phone.trim() });
    } catch {
      setError(fr ? 'Connexion interrompue. Réessayez.' : 'Connection lost. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const title = done.method === 'download' ? (fr ? 'Document téléchargé' : 'Document downloaded') : fr ? 'Document envoyé' : 'Document sent';
    const detail =
      done.method === 'download'
        ? fr ? 'Le PDF est enregistré sur votre appareil.' : 'The PDF is saved on your device.'
        : fr ? `Envoyé à ${done.recipient} sur WhatsApp.` : `Sent to ${done.recipient} on WhatsApp.`;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600">{detail}</p>
          <p className="font-mono text-xs text-slate-500">{pdfDoc.number}</p>
        </div>
        <div className="flex w-full flex-col gap-2 pt-2 sm:flex-row">
          <Link href={`/${locale}/documents/${documentId}` as Route} className="flex-1">
            <Button fullWidth variant="secondary">{fr ? 'Retour au document' : 'Back to document'}</Button>
          </Link>
          <Link href={`/${locale}/documents/new` as Route} className="flex-1">
            <Button fullWidth>{fr ? 'Nouveau document' : 'New document'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const submitLabel =
    method === 'whatsapp' ? (fr ? 'Envoyer par WhatsApp' : 'Send via WhatsApp') : fr ? 'Télécharger le PDF' : 'Download PDF';

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="space-y-1">
        <Link href={`/${locale}/documents/${documentId}` as Route} className="text-xs font-medium text-slate-500 hover:text-slate-800">
          ← {fr ? 'Retour au document' : 'Back to document'}
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {fr ? 'Envoyer' : 'Send'} {pdfDoc.number}
        </h1>
        <p className="text-sm text-slate-500">
          {docLabel}
          {clientName ? ` · ${clientName}` : ''}
        </p>
      </div>

      {!online && (
        <div role="status" className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm text-slate-700">
          {fr
            ? 'Vous êtes hors ligne. Le document peut être préparé, mais l’envoi exige une connexion.'
            : 'You are offline. The document can be prepared, but sending requires a connection.'}
        </div>
      )}

      <div role="radiogroup" aria-label={fr ? 'Méthode d’envoi' : 'Send method'} className="grid grid-cols-2 gap-3">
        {METHODS.map(({ id, icon: Icon, fr: lf, en: le }) => {
          const selected = method === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                setMethod(id);
                setError(null);
              }}
              className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center transition ${
                selected ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-semibold">{fr ? lf : le}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        {method === 'whatsapp' && (
          <>
            <Input
              id="send-phone"
              type="tel"
              inputMode="tel"
              label={fr ? 'Numéro WhatsApp du client' : 'Client WhatsApp number'}
              placeholder="6 99 12 34 56"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12"
            />
            <div>
              <label htmlFor="send-message" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                {fr ? 'Message (facultatif)' : 'Message (optional)'}
              </label>
              <textarea
                id="send-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[16px] sm:text-sm text-ink focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </>
        )}

        {method === 'download' && (
          <p className="text-sm text-slate-600">
            {fr
              ? 'Le PDF est enregistré sur votre appareil. Vous pourrez ensuite le transmettre comme vous le souhaitez.'
              : 'The PDF is saved on your device. You can then share it however you like.'}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button
          type="button"
          fullWidth
          size="lg"
          className="min-h-12"
          onClick={submit}
          disabled={busy || (method === 'whatsapp' && !online)}
          isLoading={busy}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
