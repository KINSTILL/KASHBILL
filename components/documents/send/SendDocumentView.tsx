'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, Download, Loader2, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { renderPdfToBlob, downloadBlob } from '@/lib/pdf/render';
import { buildWhatsAppUrl } from '@/lib/share/whatsapp';
import type { PdfDocument, PdfFormat } from '@/lib/pdf/types';

type Method = 'whatsapp' | 'email' | 'download';

const METHODS: { id: Method; icon: typeof Mail; fr: string; en: string }[] = [
  { id: 'whatsapp', icon: MessageCircle, fr: 'WhatsApp', en: 'WhatsApp' },
  { id: 'email', icon: Mail, fr: 'Email', en: 'Email' },
  { id: 'download', icon: Download, fr: 'Télécharger', en: 'Download' },
];

type Done = { method: Method; recipient: string | null; fallback: boolean };

function blobToBase64(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = reject;
    reader.readAsDataURL(b);
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SendDocumentView({
  documentId,
  pdfDoc,
  format,
  locale,
  docLabel,
  defaultPhone,
  defaultEmail,
  clientName,
}: {
  documentId: string;
  pdfDoc: PdfDocument;
  format: PdfFormat;
  locale: 'fr' | 'en';
  docLabel: string;
  defaultPhone: string;
  defaultEmail: string;
  clientName: string | null;
}) {
  const fr = locale === 'fr';
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [method, setMethod] = useState<Method>('whatsapp');
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState(
    fr
      ? `Bonjour${clientName ? ` ${clientName}` : ''}, veuillez trouver ci-joint ${docLabel.toLowerCase()} ${pdfDoc.number}. Merci pour votre confiance.`
      : `Hello${clientName ? ` ${clientName}` : ''}, please find attached ${docLabel.toLowerCase()} ${pdfDoc.number}. Thank you for your trust.`
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    let mounted = true;
    renderPdfToBlob(pdfDoc, format, {
      format,
      showLogo: true,
      showSignature: true,
      showStamp: true,
      showCgv: true,
      showWatermark: pdfDoc.watermarked,
      whiteLabel: pdfDoc.whiteLabel ?? false,
    })
      .then((b) => mounted && setPdf(b))
      .catch(() => mounted && setPdfError(true));
    return () => {
      mounted = false;
    };
    // Le PDF ne dépend que du document chargé côté serveur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const markSent = async () => {
    try {
      await fetch(`/api/documents/${documentId}/mark-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      });
    } catch {}
  };

  const fileName = `${pdfDoc.number}.pdf`;

  const submit = async () => {
    setError(null);
    if (!pdf) {
      setError(fr ? 'Le document n’est pas encore prêt.' : 'The document is not ready yet.');
      return;
    }
    if (method === 'whatsapp' && phone.replace(/\D/g, '').length < 6) {
      setError(fr ? 'Saisissez un numéro WhatsApp valide.' : 'Enter a valid WhatsApp number.');
      return;
    }
    if (method === 'email' && !EMAIL_RE.test(email.trim())) {
      setError(fr ? 'Saisissez une adresse email valide.' : 'Enter a valid email address.');
      return;
    }

    setBusy(true);
    try {
      if (method === 'download') {
        downloadBlob(pdf, fileName);
        await markSent();
        setDone({ method, recipient: null, fallback: false });
        return;
      }

      const pdfBase64 = await blobToBase64(pdf);

      if (method === 'whatsapp') {
        const res = await fetch(`/api/documents/${documentId}/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
          body: JSON.stringify({ phone: phone.trim(), message, pdfBase64, filename: fileName, locale }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data?.error?.code === 'PLAN_LIMIT_REACHED') {
          setError(data.error.message);
          return;
        }
        if (res.ok && data?.sentDirect) {
          setDone({ method, recipient: phone.trim(), fallback: false });
          return;
        }
        // Envoi direct indisponible : on télécharge le PDF et on ouvre WhatsApp pour le joindre
        downloadBlob(pdf, fileName);
        window.open(buildWhatsAppUrl(phone.trim(), message), '_blank');
        await markSent();
        setDone({ method, recipient: phone.trim(), fallback: true });
        return;
      }

      // email
      const res = await fetch(`/api/documents/${documentId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ to: email.trim(), customMessage: message.trim() || null, locale, pdfBase64 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? (fr ? 'Échec de l’envoi. Réessayez.' : 'Sending failed. Please try again.'));
        return;
      }
      setDone({ method, recipient: email.trim(), fallback: false });
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
        : done.fallback
          ? fr ? 'Document prêt à être envoyé' : 'Document ready to send'
          : fr ? 'Document envoyé' : 'Document sent';
    const detail =
      done.method === 'download'
        ? fr ? 'Le PDF est enregistré sur votre appareil.' : 'The PDF is saved on your device.'
        : done.fallback
          ? fr
            ? `Le PDF est téléchargé. Joignez-le dans la conversation WhatsApp avec ${done.recipient}.`
            : `The PDF is downloaded. Attach it in the WhatsApp chat with ${done.recipient}.`
          : fr
            ? `Envoyé à ${done.recipient}.`
            : `Sent to ${done.recipient}.`;
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
            <Button fullWidth variant="secondary">
              {fr ? 'Retour au document' : 'Back to document'}
            </Button>
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
      : method === 'email'
        ? fr ? 'Envoyer par email' : 'Send by email'
        : fr ? 'Télécharger le PDF' : 'Download PDF';

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="space-y-1">
        <Link
          href={`/${locale}/documents/${documentId}` as Route}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
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

      {/* Trois méthodes de même taille et même style : aucune n'est mise en avant */}
      <div role="radiogroup" aria-label={fr ? 'Méthode d’envoi' : 'Send method'} className="grid grid-cols-3 gap-3">
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
                selected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
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
          <Input
            type="tel"
            inputMode="tel"
            label={fr ? 'Numéro WhatsApp du client' : 'Client WhatsApp number'}
            placeholder="6 99 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12"
          />
        )}

        {method === 'email' && (
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            label={fr ? 'Adresse email du client' : 'Client email address'}
            placeholder="client@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
        )}

        {method === 'download' && (
          <p className="text-sm text-slate-600">
            {fr
              ? 'Le PDF est enregistré sur votre appareil. Vous pourrez ensuite le transmettre comme vous le souhaitez.'
              : 'The PDF is saved on your device. You can then share it however you like.'}
          </p>
        )}

        {method !== 'download' && (
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
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          type="button"
          fullWidth
          size="lg"
          className="min-h-12"
          onClick={submit}
          disabled={busy || !pdf}
          isLoading={busy}
        >
          {!pdf && !pdfError ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {fr ? 'Préparation du PDF…' : 'Preparing PDF…'}
            </span>
          ) : (
            submitLabel
          )}
        </Button>
        {pdfError && (
          <p className="text-center text-xs text-red-600">
            {fr ? 'Impossible de préparer le PDF. Rechargez la page.' : 'Could not prepare the PDF. Reload the page.'}
          </p>
        )}
      </div>
    </div>
  );
}
