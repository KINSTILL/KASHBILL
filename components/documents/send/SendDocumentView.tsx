'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { CheckCircle2, ChevronDown, Download, Link2, MessageCircle, Search, Share2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InfoTip } from '@/components/ui/InfoTip';
import { downloadBlob } from '@/lib/pdf/render';
import { useOnlineStatus } from '@/lib/device/network';
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByPhone, type DialCountry } from '@/lib/countries/dial-codes';
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
  fallbackUrl?: string;
};

/**
 * Aperçu du numéro tel qu'il sera envoyé (affichage seul).
 * Reproduit la normalisation serveur pour que l'utilisateur voie immédiatement
 * une saisie erronée, sans attendre la réponse du serveur.
 */
function previewNumber(raw: string, dialCode: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const hasPrefix = /^\+|^00/.test(trimmed);
  const digits = trimmed.replace(/^\+/, '').replace(/^00/, '').replace(/\D/g, '');
  if (!digits) return '';

  // Indicatif déjà présent en tête (sur ≥ 3 chiffres, ou `+`/`00` explicite).
  const matches = COUNTRIES.filter((c) => digits.startsWith(c.dialCode.replace(/\D/g, ''))).sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );
  const selectedCc = dialCode.replace(/\D/g, '');
  let cc: string | null = null;
  let national = digits;

  if (hasPrefix) {
    cc = matches[0]?.dialCode.replace(/\D/g, '') ?? null;
    if (cc) national = digits.slice(cc.length);
  } else {
    const det = matches[0];
    const detCc = det ? det.dialCode.replace(/\D/g, '') : null;
    const fits =
      det !== undefined &&
      digits.length - detCc!.length >= det.minDigits &&
      digits.length - detCc!.length <= det.maxDigits;
    if (det && (detCc === selectedCc || detCc!.length >= 3 || fits)) {
      cc = detCc;
      national = digits.slice(detCc!.length);
    } else {
      cc = selectedCc;
    }
  }

  if (!cc) return '';
  const finalCc: string = cc;
  const bounds = COUNTRIES.find((c) => c.dialCode.replace(/\D/g, '') === finalCc);
  if (!bounds || national.length > bounds.maxDigits) national = national.replace(/^0+/, '');
  if (!national) return '';
  if (bounds && national.length < bounds.minDigits) return '';
  const full = `${finalCc}${national}`;
  if (full.length < 6 || full.length > 15) return '';
  return full;
}

/** Formate un numéro E.164 en blocs lisibles : `+237 6 99 12 34 56`. */
function formatPreview(full: string): string {
  if (!full) return '';
  const country = COUNTRIES.filter((c) => full.startsWith(c.dialCode.replace(/\D/g, ''))).sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  )[0];
  if (!country) return `+${full}`;
  const cc = country.dialCode.replace(/\D/g, '');
  const rest = full.slice(cc.length);
  const groups = rest.match(/.{1,2}/g) ?? [rest];
  return `${country.dialCode} ${groups.join(' ')}`;
}

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

  // Pays du destinataire : déduit du numéro du client (« +XX… », « 00XX… » ou préfixe direct), sinon Cameroun.
  // Le numéro national est saisi sans l'indicatif ; l'indicatif est ajouté à l'envoi.
  const initialCountry = useMemo<DialCountry>(() => {
    const raw = defaultPhone.trim();
    if (raw.startsWith('+') || raw.startsWith('00')) {
      return findCountryByPhone(raw);
    }
    const digits = raw.replace(/\D/g, '');
    const matched = COUNTRIES.find(
      (c) => digits.startsWith(c.dialCode.replace(/\D/g, '')) && digits.length > c.dialCode.length + 5
    );
    if (matched) return matched;
    return DEFAULT_COUNTRY;
  }, [defaultPhone]);

  const [country, setCountry] = useState<DialCountry>(initialCountry);
  const [phone, setPhone] = useState(() => {
    const raw = defaultPhone.trim();
    const digits = raw.replace(/^\+/, '').replace(/^00/, '').replace(/\D/g, '');
    const cc = initialCountry.dialCode.replace(/\D/g, '');
    if (digits.startsWith(cc) && digits.length > cc.length + 5) {
      return digits.slice(cc.length);
    }
    return raw.replace(/^\+/, '').replace(/^00/, '');
  });

  const handlePhoneChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
      const detected = findCountryByPhone(trimmed);
      setCountry(detected);
      const cc = detected.dialCode.replace(/\D/g, '');
      const digits = trimmed.replace(/^\+/, '').replace(/^00/, '').replace(/\D/g, '');
      if (digits.startsWith(cc)) {
        setPhone(digits.slice(cc.length));
      } else {
        setPhone(digits);
      }
      setError(null);
      return;
    }
    setPhone(val);
    setError(null);
  };
  const [message, setMessage] = useState(
    fr
      ? `Bonjour${clientName ? ` ${clientName}` : ''}, veuillez trouver ci-joint ${docLabel.toLowerCase()} ${pdfDoc.number}. Merci pour votre confiance.`
      : `Hello${clientName ? ` ${clientName}` : ''}, please find attached ${docLabel.toLowerCase()} ${pdfDoc.number}. Thank you for your trust.`
  );
  // Aperçu du numéro effectivement utilisé (masqué si le champ est vide).
  const normalizedPhone = useMemo(() => previewNumber(phone, country.dialCode), [phone, country.dialCode]);
  const phonePreview = formatPreview(normalizedPhone);

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

    // On envoie la SAISIE BRUTE + le pays choisi : le serveur normalise une seule fois
  // (il détecte un indicatif déjà présent et ne le préfixe jamais deux fois).
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ phone: phone.trim(), message, filename: fileName, locale, mode: channel, includeXml, countryCode: country.code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? (fr ? 'Envoi impossible.' : 'Sending failed.'));
        return;
      }
      if (data?.sentDirect) {
        setDone({
          method,
          recipient: phonePreview || `+${country.dialCode.replace(/\D/g, '')} ${phone.trim()}`,
          xmlSent: data?.xmlSent === true,
        });
        return;
      }
      if (data?.fallbackUrl) {
        // En cas d'indisponibilité du serveur, on prépare le lien de secours SANS forcer
        // l'ouverture d'une fenêtre intempestive (l'utilisateur garde le contrôle).
        setDone({
          method,
          recipient: phonePreview || `+${country.dialCode.replace(/\D/g, '')} ${phone.trim()}`,
          xmlSent: false,
          fallbackUrl: data.fallbackUrl,
          downloadUrl: data.downloadUrl,
          xmlUrl: data.xmlUrl,
        });
        return;
      }
      setError(
        fr
          ? "L'envoi WhatsApp n'a pas abouti. Réessayez ou téléchargez le PDF."
          : 'WhatsApp sending did not complete. Try again or download the PDF.'
      );
      return;
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
          : done.fallbackUrl
            ? fr ? 'Prêt dans WhatsApp' : 'Ready in WhatsApp'
            : fr ? 'Document envoyé' : 'Document sent';
    const detail =
      done.method === 'download'
        ? fr ? 'Le PDF est enregistré sur votre appareil.' : 'The PDF is saved on your device.'
        : done.method === 'link'
          ? fr
            ? 'Partagez ce lien : il permet de télécharger le PDF.'
            : 'Share this link: it lets the recipient download the PDF.'
          : done.fallbackUrl
            ? fr
              ? `L'envoi direct depuis le serveur n'a pas abouti. Cliquez ci-dessous pour transmettre le document à ${done.recipient} via votre WhatsApp.`
              : `Direct server sending could not complete. Click below to share with ${done.recipient} via your WhatsApp.`
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
        {done.method === 'whatsapp' && done.fallbackUrl && (
          <div className="w-full space-y-3">
            <Button
              type="button"
              fullWidth
              size="lg"
              className="min-h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white border-0 shadow-sm font-semibold"
              onClick={() => window.open(done.fallbackUrl, '_blank')}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              {fr ? 'Ouvrir dans WhatsApp' : 'Open in WhatsApp'}
            </Button>
            {done.downloadUrl && (
              <div className="w-full space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left">
                <LinkRow
                  label={
                    fr
                      ? `Lien de téléchargement de la ${docLabel.toLowerCase()}`
                      : `Download link for the ${docLabel.toLowerCase()}`
                  }
                  url={done.downloadUrl}
                  fr={fr}
                />
                {done.xmlUrl && (
                  <LinkRow
                    label={fr ? 'Lien de téléchargement du fichier XML' : 'Download link for the XML file'}
                    url={done.xmlUrl}
                    fr={fr}
                  />
                )}
              </div>
            )}
          </div>
        )}
        {done.method === 'whatsapp' && includeXml && done.xmlSent === false && !done.fallbackUrl && (
          <p role="alert" className="w-full rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {fr
              ? "Le PDF a bien été envoyé, mais le fichier XML n'a pas pu être joint. Vous pouvez le télécharger depuis le document."
              : 'The PDF was sent, but the XML file could not be attached. You can download it from the document.'}
          </p>
        )}
        {done.method === 'link' && done.downloadUrl && (
          <div className="w-full space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left">
            <LinkRow
              label={
                fr
                  ? `Lien de téléchargement de la ${docLabel.toLowerCase()}`
                  : `Download link for the ${docLabel.toLowerCase()}`
              }
              url={done.downloadUrl}
              fr={fr}
            />
            {done.xmlUrl && (
              <LinkRow
                label={fr ? 'Lien de téléchargement du fichier XML' : 'Download link for the XML file'}
                url={done.xmlUrl}
                fr={fr}
              />
            )}
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
                      ? 'Envoyer depuis votre propre numéro : votre client reçoit le PDF brut, dans votre fil de discussion habituel, sans aucune mention MyCashBill. Inclus automatiquement avec le statut Pro.'
                      : 'Send from your own number: your client receives the raw PDF in your usual chat, with zero MyCashBill mention. Included automatically with Pro.'}
                  </p>
                  <p>
                    {fr
                      ? 'Pour activer cette option, passez Pro puis connectez votre numéro dans Paramètres › WhatsApp.'
                      : 'To enable this option, upgrade to Pro and connect your number in Settings › WhatsApp.'}
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
                      : personalWhatsApp.hasAddOn
                        ? fr
                          ? 'Numéro non connecté (scannez le QR code)'
                          : 'Number not connected (scan QR code)'
                        : fr
                          ? 'Inclus en formule Pro (connectez votre compte)'
                          : 'Included in Pro (connect your account)'}
                  </span>
                </button>
              </div>
              {!personalAvailable && (
                <Link
                  href={
                    personalWhatsApp.hasAddOn
                      ? (`/${locale}/settings/whatsapp` as Route)
                      : (`/${locale}/upgrade` as Route)
                  }
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  {personalWhatsApp.hasAddOn
                    ? fr
                      ? 'Connecter mon numéro WhatsApp maintenant'
                      : 'Connect my WhatsApp number now'
                    : fr
                      ? 'Passer Pro pour envoyer avec mon propre numéro'
                      : 'Upgrade to Pro to send from your own number'} →
                </Link>
              )}
            </div>
            <CountryPhoneField
              fr={fr}
              label={fr ? 'Numéro WhatsApp du client' : 'Client WhatsApp number'}
              country={country}
              onCountryChange={(c) => {
                setCountry(c);
                setError(null);
              }}
              phone={phone}
              onPhoneChange={handlePhoneChange}
            />
            {phone.trim().length > 0 && (
              <p
                role="status"
                aria-live="polite"
                className={`-mt-1 text-[12px] ${normalizedPhone ? 'text-slate-500' : 'text-red-600'}`}
              >
                {normalizedPhone
                  ? fr
                    ? <>Sera envoyé à <span className="font-mono font-semibold text-slate-800">{phonePreview}</span></>
                    : <>Will be sent to <span className="font-mono font-semibold text-slate-800">{phonePreview}</span></>
                  : fr
                    ? 'Numéro invalide : vérifiez l’indicatif et le nombre de chiffres.'
                    : 'Invalid number: check the country code and digit count.'}
              </p>
            )}
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
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {fr
                ? 'Téléchargez le fichier PDF sur votre appareil ou partagez-le directement (WhatsApp, e-mail, Bluetooth...) comme dans Acrobat Reader.'
                : 'Download the PDF file to your device or share it directly (WhatsApp, email, Bluetooth...) Acrobat Reader style.'}
            </p>
            <Button
              type="button"
              fullWidth
              size="lg"
              variant="outline"
              className="min-h-12 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold"
              onClick={async () => {
                setError(null);
                setBusy(true);
                try {
                  const blob = await fetchPdf();
                  const file = new File([blob], fileName, { type: 'application/pdf' });
                  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                      files: [file],
                      title: `${docLabel} ${pdfDoc.number}`,
                      text: message,
                    });
                    await markSent();
                  } else {
                    // Repli automatique si le navigateur ne supporte pas le partage direct de fichiers
                    downloadBlob(blob, fileName);
                    await markSent();
                  }
                  setDone({ method: 'download', recipient: null });
                } catch (e: any) {
                  if (e?.name !== 'AbortError') {
                    setError(fr ? 'Partage impossible. Téléchargez le PDF directement.' : 'Sharing failed. Please download the PDF directly.');
                  }
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              isLoading={busy}
            >
              <Share2 className="h-5 w-5 mr-2" />
              {fr ? 'Partager le fichier PDF' : 'Share PDF file'}
            </Button>
          </div>
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
          <div role="alert" className="space-y-2 rounded-xl bg-red-50 p-3 text-sm text-red-800 border border-red-100">
            <p>{error}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white border-red-200 text-red-700 hover:bg-red-50"
                onClick={async () => {
                  try {
                    downloadBlob(await fetchPdf(), fileName);
                    await markSent();
                  } catch {}
                }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                {fr ? 'Télécharger le PDF' : 'Download PDF'}
              </Button>
            </div>
          </div>
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

/**
 * Champ numéro avec choix de l'indicatif pays.
 * Reprend exactement le style du champ numéro de l'écran d'envoi (label, h-12, rounded-xl,
 * focus emerald) : aucune rupture visuelle avec les autres champs.
 */
function CountryPhoneField({
  fr,
  label,
  country,
  onCountryChange,
  phone,
  onPhoneChange,
}: {
  fr: boolean;
  label: string;
  country: DialCountry;
  onCountryChange: (c: DialCountry) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = COUNTRIES.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.nameFr.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative" ref={boxRef}>
      <label htmlFor="send-phone" className="mb-1.5 block text-[13px] font-medium text-slate-700">
        {label}
      </label>
      <div className="flex rounded-xl border border-slate-200 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={fr ? 'Choisir l’indicatif du pays' : 'Select country code'}
          className="inline-flex h-12 select-none items-center gap-1.5 rounded-l-xl border-r border-slate-200 bg-slate-50/60 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            {country.flag}
          </span>
          <span className="font-mono text-xs font-bold text-slate-800">{country.dialCode}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        <input
          id="send-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={fr ? '6 99 12 34 56' : '6 99 12 34 56'}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="h-12 w-full rounded-r-xl bg-transparent px-3 text-[16px] text-ink placeholder:text-slate-400 focus:outline-none sm:text-sm"
        />
      </div>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
        >
          <div className="relative mb-1.5 px-1 pt-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={fr ? 'Rechercher un pays ou indicatif…' : 'Search country or code…'}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                {fr ? 'Aucun pays trouvé' : 'No country found'}
              </div>
            ) : (
              filtered.map((c) => {
                const selected = c.code === country.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onCountryChange(c);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      selected ? 'bg-emerald-50 font-semibold text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className="text-base leading-none" aria-hidden="true">
                        {c.flag}
                      </span>
                      <span className="truncate">{fr ? c.nameFr : c.nameEn}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{c.dialCode}</span>
                      {selected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ligne de téléchargement : le lien est directement cliquable (nouvel onglet),
 * avec un libellé parlant pour l'utilisateur et un bouton « Copier ».
 */
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
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-2.5 py-2 text-[12px] font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-2 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 break-all"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="break-all">{url}</span>
      </a>
      <Button type="button" variant="outline" size="sm" fullWidth onClick={copy}>
        {copied ? (fr ? 'Copié' : 'Copied') : fr ? 'Copier le lien' : 'Copy link'}
      </Button>
    </div>
  );
}
