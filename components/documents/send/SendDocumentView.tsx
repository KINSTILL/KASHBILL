'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, Download, Link2, MessageCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InfoTip } from '@/components/ui/InfoTip';
import { downloadBlob } from '@/lib/pdf/render';
import { useOnlineStatus } from '@/lib/device/network';
import type { PdfDocument } from '@/lib/pdf/types';

type Method = 'whatsapp' | 'download' | 'link';
type Channel = 'shared' | 'personal';

const METHODS: { id: Method; icon: typeof MessageCircle; fr: string; en: string }[] = [
  { id: 'whatsapp', icon: MessageCircle, fr: 'WhatsApp', en: 'WhatsApp' },
  { id: 'download', icon: Download, fr: 'Télécharger', en: 'Download' },
  { id: 'link', icon: Link2, fr: 'Lien', en: 'Link' },
];

type Done = {
  method: Method;
  recipient: string | null;
  xmlSent?: boolean;
  downloadUrl?: string;
  xmlUrl?: string;
};

export function SendDocumentView({
  documentId,
  pdfDoc,
  locale,
  docLabel,
  defaultPhone,
  clientName,
  personalWhatsApp,
}: {
  documentId: string;
  pdfDoc: PdfDocument;
  locale: 'fr' | 'en';
  docLabel: string;
  defaultPhone: string;
  clientName: string | null;
  personalWhatsApp: { hasAddOn: boolean; connected: boolean };
}) {
  const fr = locale === 'fr';
  const online = useOnlineStatus();
  const [method, setMethod] = useState<Method>('whatsapp');
  const [channel, setChannel] = useState<Channel>('shared');
  const personalAvailable = personalWhatsApp.hasAddOn && personalWhatsApp.connected;
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState(
    fr
      ? `Bonjour${clientName ? ` ${clientName}` : ''}, veuillez trouver ci-joint ${docLabel.toLowerCase()} ${pdfDoc.number}. Merci pour votre confiance.`
      : `Hello${clientName ? ` ${clientName}` : ''}, please find attached ${docLabel.toLowerCase()} ${pdfDoc.number}. Thank you for your trust.`
  );
  const [busy, setBusy] = useState(false);
  const [includeXml, setIncludeXml] = useState(false);
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

    // Lien de téléchargement : le serveur prépare le PDF et renvoie une URL publique signée.
    if (method === 'link') {
      if (!online) {
        setError(fr ? 'Connexion requise pour créer le lien. Réessayez une fois connecté.' : 'Connection required to create the link. Try again once online.');
        return;
      }
      setBusy(true);
      try {
        const res = await fetch(`/api/documents/${documentId}/share-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
          body: JSON.stringify({ includeXml }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error?.message ?? (fr ? 'Création du lien impossible.' : 'Could not create the link.'));
          return;
        }
        if (!data?.downloadUrl) {
          setError(fr ? 'Création du lien impossible.' : 'Could not create the link.');
          return;
        }
        await markSent();
        setDone({ method: 'link', recipient: null, downloadUrl: data.downloadUrl, xmlUrl: data?.xmlUrl });
      } catch {
        setError(fr ? 'Connexion interrompue. Réessayez.' : 'Connection lost. Please try again.');
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
        body: JSON.stringify({ phone: phone.trim(), message, filename: fileName, locale, mode: channel, includeXml }),
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
      setDone({ method, recipient: phone.trim(), xmlSent: data?.xmlSent === true });
    } catch {
      setError(fr ? 'Connexion interrompue. Réessayez.' : 'Connection lost. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const title =
      done.method === 'download'
        ? fr ? 'Document téléchargé' : 'Document downloaded'
        : done.method === 'link'
          ? fr ? 'Lien prêt' : 'Link ready'
          : fr ? 'Document envoyé' : 'Document sent';
    const detail =
      done.method === 'download'
        ? fr ? 'Le PDF est enregistré sur votre appareil.' : 'The PDF is saved on your device.'
        : done.method === 'link'
          ? fr
            ? 'Partagez ce lien : il permet de télécharger le PDF.'
            : 'Share this link: it lets the recipient download the PDF.'
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
        {done.method === 'whatsapp' && includeXml && done.xmlSent === false && (
          <p role="alert" className="w-full rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {fr
              ? "Le PDF a bien été envoyé, mais le fichier XML n'a pas pu être joint. Vous pouvez le télécharger depuis le document."
              : 'The PDF was sent, but the XML file could not be attached. You can download it from the document.'}
          </p>
        )}
        {done.method === 'link' && done.downloadUrl && (
          <div className="w-full space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left">
            <LinkRow label="PDF" url={done.downloadUrl} fr={fr} />
            {done.xmlUrl && <LinkRow label="XML" url={done.xmlUrl} fr={fr} />}
          </div>
        )}
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
    method === 'whatsapp'
      ? fr ? 'Envoyer par WhatsApp' : 'Send via WhatsApp'
      : method === 'download'
        ? fr ? 'Télécharger le PDF' : 'Download PDF'
        : fr ? 'Créer le lien de téléchargement' : 'Create download link';

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

      <div role="radiogroup" aria-label={fr ? 'Méthode d’envoi' : 'Send method'} className="grid grid-cols-3 gap-2 sm:gap-3">
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
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-slate-700">
                  {fr ? 'Depuis quel numéro envoyer ?' : 'Send from which number?'}
                </span>
                <InfoTip
                  id="tip-personal-channel"
                  label={fr ? 'Pourquoi mon numéro ?' : 'Why my number?'}
                >
                  <p>
                    {fr
                      ? 'Envoyer depuis votre propre numéro : votre client reçoit le PDF brut, dans votre fil de discussion habituel, sans aucune mention MyCashBill. Un vrai raccourci.'
                      : 'Send from your own number: your client receives the raw PDF in your usual chat, with zero MyCashBill mention. A real shortcut.'}
                  </p>
                  <p>
                    {fr
                      ? 'Pour activer cette option, souscrivez l’extension « Mon numéro WhatsApp » (500 FCFA) puis connectez votre numéro.'
                      : 'To enable this option, subscribe to the “My WhatsApp number” add-on (500 FCFA) then connect your number.'}
                  </p>
                </InfoTip>
              </div>
              <div role="radiogroup" aria-label={fr ? 'Numéro d’envoi' : 'Sending number'} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={channel === 'shared'}
                  onClick={() => {
                    setChannel('shared');
                    setError(null);
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition ${
                    channel === 'shared' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-semibold text-ink">{fr ? 'MyCashBill' : 'MyCashBill'}</span>
                  <span className="text-[11px] text-slate-500">
                    {fr ? 'Envoi via MyCashBill (toujours disponible)' : 'Send via MyCashBill (always available)'}
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={channel === 'personal'}
                  aria-disabled={!personalAvailable}
                  onClick={() => {
                    if (!personalAvailable) return;
                    setChannel('personal');
                    setError(null);
                  }}
                  className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition ${
                    !personalAvailable
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'
                      : channel === 'personal'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Smartphone className="h-4 w-4" />
                    {fr ? 'Mon numéro' : 'My number'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {personalAvailable
                      ? fr
                        ? 'Envoi depuis votre numéro WhatsApp'
                        : 'Send from your WhatsApp number'
                      : fr
                        ? 'Extension non activée — 500 FCFA'
                        : 'Add-on not active — 500 FCFA'}
                  </span>
                </button>
              </div>
              {!personalAvailable && (
                <Link
                  href={`/${locale}/upgrade` as Route}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  {fr ? 'Activer « Mon numéro WhatsApp » (500 FCFA)' : 'Activate “My WhatsApp number” (500 FCFA)'} →
                </Link>
              )}
            </div>
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
                    ? 'Envoyé juste après le PDF, lisible par les logiciels de comptabilité.'
                    : 'Sent right after the PDF, readable by accounting software.'}
                </span>
              </span>
            </label>
          </>
        )}

        {method === 'download' && (
          <p className="text-sm text-slate-600">
            {fr
              ? 'Le PDF est enregistré sur votre appareil. Vous pourrez ensuite le transmettre comme vous le souhaitez.'
              : 'The PDF is saved on your device. You can then share it however you like.'}
          </p>
        )}

        {method === 'link' && (
          <>
            <p className="text-sm text-slate-600">
              {fr
                ? 'Un lien de téléchargement est créé. Vous pouvez l’envoyer par SMS, e-mail ou dans n’importe quelle conversation.'
                : 'A download link is created. You can send it by SMS, email or in any chat.'}
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeXml}
                onChange={(e) => setIncludeXml(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="block font-semibold text-slate-900">
                  {fr ? 'Créer aussi le lien du fichier XML' : 'Also create the XML file link'}
                </span>
                <span className="block text-xs text-slate-500">
                  {fr
                    ? 'Un second lien, lisible par les logiciels de comptabilité.'
                    : 'A second link, readable by accounting software.'}
                </span>
              </span>
            </label>
          </>
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
          disabled={busy || ((method === 'whatsapp' || method === 'link') && !online)}
          isLoading={busy}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

/** Affiche une URL de partage avec un bouton « Copier » aligné sur le style des boutons existants. */
function LinkRow({ label, url, fr }: { label: string; url: string; fr: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="break-all rounded-lg border border-slate-200 bg-white px-2.5 py-2 font-mono text-[11px] text-slate-600">
        {url}
      </p>
      <Button type="button" variant="outline" size="sm" fullWidth onClick={copy}>
        {copied ? (fr ? 'Copié' : 'Copied') : fr ? 'Copier le lien' : 'Copy link'}
      </Button>
    </div>
  );
}
