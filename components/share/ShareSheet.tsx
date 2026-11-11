'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/device/haptics';
import {
  loadSharePrefs,
  saveSharePrefs,
  clearCustomMessage,
  getShareGroup,
  type ShareTone,
  type ShareDistance,
} from '@/lib/share/storage';
import { resolveShareMessage } from '@/lib/share/messages';
import { buildWhatsAppUrl, shareNative } from '@/lib/share/whatsapp';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro } from '@/lib/auth/plan';
import { ProBadge } from '@/components/ui/ProBadge';
import { EmailSendSheet } from '@/components/documents/EmailSendSheet';
import type { DocType } from '@prisma/client';

export type ShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType: DocType;
  clientName: string;
  clientPhone: string | null;
  clientEmail?: string | null;
  pdfBlob: Blob;
  documentNumber: string;
  documentId?: string;
  docLocale?: 'FR' | 'EN';
  onSent: () => void;
};

export function ShareSheet({
  open,
  onOpenChange,
  docType,
  clientPhone,
  clientEmail,
  pdfBlob,
  documentNumber,
  documentId,
  docLocale,
  onSent,
}: ShareSheetProps) {
  const tRoot = useTranslations();
  const t = useTranslations('share');
  const toast = useToast();
  const locale = useLocale() as 'fr' | 'en';
  const effectiveLocale = (docLocale ? docLocale.toLowerCase() : locale) as 'fr' | 'en';
  const group = getShareGroup(docType);
  const { user } = useCurrentUser();
  const userIsPro = user ? isPro({ proUntil: user.proUntil }) : false;

  const [prefs, setPrefs] = useState(loadSharePrefs());
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState(clientPhone ?? '');
  const [email, setEmail] = useState(clientEmail ?? '');
  const [isCustom, setIsCustom] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone(clientPhone ?? '');
      setEmail(clientEmail ?? '');
    }
  }, [open, clientPhone, clientEmail]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        setCanShare(
          navigator.canShare({
            files: [new File([pdfBlob], 'x.pdf', { type: 'application/pdf' })],
          })
        );
      } catch {
        setCanShare(false);
      }
    }
  }, [pdfBlob]);

  useEffect(() => {
    if (!open) return;
    const loaded = loadSharePrefs();
    setPrefs(loaded);
    setMessage(
      resolveShareMessage(
        tRoot,
        group,
        loaded.lastTone,
        loaded.lastDistance,
        effectiveLocale,
        undefined,
        docType
      )
    );
    setIsCustom(false);
  }, [open, group, docType, effectiveLocale, tRoot]);

  const applyToneDistance = (tone: ShareTone, distance: ShareDistance) => {
    haptic('light');
    const nextPrefs = { ...prefs, lastTone: tone, lastDistance: distance };
    setPrefs(nextPrefs);
    saveSharePrefs(nextPrefs);
    clearCustomMessage(group);
    setIsCustom(false);
    setMessage(
      resolveShareMessage(tRoot, group, tone, distance, effectiveLocale, undefined, docType)
    );
  };

  const handleEdit = (value: string) => {
    setMessage(value);
    setIsCustom(true);
  };

  const handleReset = () => {
    clearCustomMessage(group);
    setIsCustom(false);
    setMessage(
      resolveShareMessage(
        tRoot,
        group,
        prefs.lastTone,
        prefs.lastDistance,
        effectiveLocale,
        undefined,
        docType
      )
    );
  };

  const finalize = () => {
    saveSharePrefs(prefs);
  };

  const markDocumentSent = async () => {
    if (!documentId) return;
    try {
      await fetch(`/api/documents/${documentId}/mark-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      });
    } catch {}
  };

  const triggerPdfDownload = () => {
    const dlUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = dlUrl;
    a.download = `${documentNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
  };

  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingLinkWhatsApp, setSendingLinkWhatsApp] = useState(false);
  const [whatsAppConfirmOpen, setWhatsAppConfirmOpen] = useState(false);

  const senderDisplayName =
    user?.businessName?.trim() || user?.name?.trim() || user?.phone || 'Votre entreprise';

  const blobToBase64 = (b: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = reject;
      reader.readAsDataURL(b);
    });

  // Clic sur le bouton principal WhatsApp -> ouvre la boîte de confirmation avec les 2 options
  const handleWhatsApp = () => {
    finalize();
    haptic('light');
    setWhatsAppConfirmOpen(true);
  };

  // Option 1 : Envoi direct du PDF brut via l'application MyCashBill (Evolution API)
  const handleDirectWhatsAppSend = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      toast.show(
        locale === 'en'
          ? 'Please enter the client WhatsApp phone number first.'
          : 'Veuillez renseigner le numéro WhatsApp du client.',
        'error'
      );
      setWhatsAppConfirmOpen(false);
      return;
    }

    if (documentId) {
      setSendingWhatsApp(true);
      try {
        const pdfBase64 = await blobToBase64(pdfBlob);
        const res = await fetch(`/api/documents/${documentId}/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
          body: JSON.stringify({
            phone: trimmedPhone,
            message,
            pdfBase64,
            filename: `${documentNumber}.pdf`,
            locale: effectiveLocale,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data?.error?.code === 'PLAN_LIMIT_REACHED') {
          toast.show(data.error.message, 'error');
          setSendingWhatsApp(false);
          setWhatsAppConfirmOpen(false);
          return;
        }
        if (res.ok && data?.sentDirect) {
          toast.show(
            locale === 'en'
              ? 'PDF document sent directly on WhatsApp!'
              : 'Document PDF envoyé directement sur WhatsApp !',
            'success'
          );
          setWhatsAppConfirmOpen(false);
          onSent();
          onOpenChange(false);
          setSendingWhatsApp(false);
          return;
        }
      } catch {
        // Fallback transparent ci-dessous si le serveur d'envoi direct est indisponible
      } finally {
        setSendingWhatsApp(false);
      }
    }

    setWhatsAppConfirmOpen(false);
    if (canShare) {
      const result = await shareNative(pdfBlob, message, `${documentNumber}.pdf`);
      if (result.ok) {
        await markDocumentSent();
        onSent();
        onOpenChange(false);
        return;
      }
      if (result.reason === 'USER_CANCELLED') {
        return;
      }
    }

    triggerPdfDownload();
    const url = buildWhatsAppUrl(trimmedPhone, message);
    window.open(url, '_blank');
    await markDocumentSent();
    onSent();
    onOpenChange(false);
  };

  // Option 2 : Envoyer un lien de téléchargement direct du PDF depuis le propre WhatsApp de l'utilisateur
  const handleOwnWhatsAppLinkSend = async () => {
    const trimmedPhone = phone.trim();
    setSendingLinkWhatsApp(true);
    try {
      let downloadUrl = '';
      if (documentId) {
        const pdfBase64 = await blobToBase64(pdfBlob);
        const res = await fetch(`/api/documents/${documentId}/share-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
          body: JSON.stringify({ pdfBase64 }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 && data?.error?.code === 'PLAN_LIMIT_REACHED') {
          toast.show(data.error.message, 'error');
          setSendingLinkWhatsApp(false);
          setWhatsAppConfirmOpen(false);
          return;
        }
        if (res.ok && typeof data?.downloadUrl === 'string') {
          downloadUrl = data.downloadUrl;
        }
      }

      const linkLabel =
        effectiveLocale === 'en'
          ? `📄 Direct PDF download (${documentNumber}.pdf):`
          : `📄 Télécharger le PDF (${documentNumber}.pdf) :`;

      const combinedMessage = downloadUrl
        ? `${message.trim()}\n\n${linkLabel}\n${downloadUrl}`
        : message.trim();

      if (!downloadUrl) {
        triggerPdfDownload();
        await markDocumentSent();
      }

      const waUrl = buildWhatsAppUrl(trimmedPhone, combinedMessage);
      window.open(waUrl, '_blank');
      setWhatsAppConfirmOpen(false);
      onSent();
      onOpenChange(false);
    } finally {
      setSendingLinkWhatsApp(false);
    }
  };

  const handleEmail = async () => {
    finalize();
    if (documentId && userIsPro) {
      // On ferme cette feuille avant d'ouvrir celle de l'email : deux tiroirs empilés
      // provoquaient un écran vide. Le marquage « envoyé » se fait dans EmailSendSheet, après succès.
      onOpenChange(false);
      setEmailSheetOpen(true);
      return;
    }
    const subject = `${docType} ${documentNumber}`;
    const cleanEmail = email.trim();
    const mailtoUrl = `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoUrl;
    await markDocumentSent();
    onSent();
    onOpenChange(false);
  };

  const handleNativeShare = async () => {
    finalize();
    const result = await shareNative(pdfBlob, message, `${documentNumber}.pdf`);
    if (result.ok) {
      await markDocumentSent();
      onSent();
      onOpenChange(false);
    } else if (result.reason === 'SHARE_NOT_SUPPORTED') {
      toast.show(t('modal.shareNotSupported'), 'error');
    }
  };

  const handleDownload = async () => {
    finalize();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await markDocumentSent();
    onSent();
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <div className="space-y-3.5">
          <h2 className="text-lg font-bold text-slate-900">{t('modal.title')}</h2>

          {/* Coordonnées du destinataire en haut de la boîte pour rester visibles quand le clavier mobile s'ouvre */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {t('modal.clientPhone')}
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={(e) => {
                  const el = e.currentTarget;
                  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
                }}
                placeholder={t('modal.clientPhonePlaceholder')}
                className="thumb-zone w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[16px] sm:text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                {t('modal.clientEmail')}
              </label>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  const el = e.currentTarget;
                  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
                }}
                placeholder={t('modal.clientEmailPlaceholder')}
                className="thumb-zone w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[16px] sm:text-sm"
              />
            </div>
          </div>

          {/* Tones & Tu/Vous sur une zone compacte */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">{t('modal.tone.label')}</p>
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-xs">
                {(['tu', 'vous'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => applyToneDistance(prefs.lastTone, d)}
                    className={`rounded px-2.5 py-0.5 font-medium transition ${
                      prefs.lastDistance === d ? 'bg-sage-500 text-white' : 'text-slate-600'
                    }`}
                  >
                    {t(`modal.distance.${d}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['transparency', 'pro', 'casual'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => applyToneDistance(tone, prefs.lastTone === tone ? prefs.lastDistance : prefs.lastDistance)}
                  className={`rounded-lg border p-2 text-xs sm:text-sm font-medium transition ${
                    prefs.lastTone === tone
                      ? 'border-sage-500 bg-sage-100 text-sage-900'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {t(`modal.tone.${tone}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Message éditable */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  {t('modal.message.label')}
                </label>
                {isCustom && (
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700">
                    {t('modal.message.customBadge')}
                  </span>
                )}
              </div>
              {isCustom && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-sage-700 underline"
                >
                  {t('modal.message.resetButton')}
                </button>
              )}
            </div>
            <textarea
              value={message}
              onChange={(e) => handleEdit(e.target.value)}
              onFocus={(e) => {
                const el = e.currentTarget;
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
              }}
              maxLength={1500}
              rows={3}
              className="thumb-zone w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-[16px] sm:text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">{t('modal.message.hint')}</p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              fullWidth
              variant="whatsapp"
              size="lg"
              onClick={handleWhatsApp}
              isLoading={sendingWhatsApp}
            >
              {t('modal.actions.whatsapp')}
            </Button>
            <Button fullWidth variant="secondary" onClick={handleEmail}>
              {t('modal.actions.email')}
            </Button>
            {canShare && (
              <Button
                fullWidth
                variant="secondary"
                className="relative"
                disabled={!userIsPro}
                onClick={() => {
                  if (!userIsPro) {
                    toast.show(t('modal.premiumOnly'), 'info');
                    return;
                  }
                  handleNativeShare();
                }}
              >
                {t('modal.actions.share')}
                {!userIsPro && <ProBadge />}
              </Button>
            )}
            <Button fullWidth variant="ghost" onClick={handleDownload}>
              {t('modal.actions.download')}
            </Button>
          </div>
        </div>
      </Sheet>

      {whatsAppConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => !sendingWhatsApp && !sendingLinkWhatsApp && setWhatsAppConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {locale === 'en'
                  ? 'Choose your WhatsApp sending mode'
                  : 'Choisissez votre mode d’envoi WhatsApp'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {locale === 'en'
                  ? 'How would you like to send this document to your client?'
                  : 'Comment souhaitez-vous transmettre ce document à votre client ?'}
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1 : Envoi direct du PDF brut via MyCashBill App */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2.5">
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    {locale === 'en'
                      ? '1. Send PDF directly via MyCashBill App'
                      : '1. Envoyer directement le PDF via MyCashBill App'}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    {locale === 'en'
                      ? `MyCashBill sends the raw PDF file and your message directly to the client on behalf of "${senderDisplayName}" (${user?.phone ?? ''}), clearly stating that MyCashBill is only a technical invoicing tool.`
                      : `MyCashBill envoie directement le fichier PDF brut et votre message au client de la part de « ${senderDisplayName} » (${user?.phone ?? ''}), en indiquant clairement que nous ne sommes qu’un outil technique utilisé par vous.`}
                  </p>
                </div>
                <Button
                  fullWidth
                  variant="whatsapp"
                  size="md"
                  onClick={handleDirectWhatsAppSend}
                  isLoading={sendingWhatsApp}
                  disabled={sendingLinkWhatsApp}
                >
                  {locale === 'en'
                    ? 'Send PDF directly via MyCashBill'
                    : 'Envoyer directement via MyCashBill'}
                </Button>
              </div>

              {/* Option 2 : Envoyer un lien de téléchargement direct depuis le WhatsApp de l'utilisateur */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {locale === 'en'
                      ? '2. Send a direct download link from my WhatsApp'
                      : '2. Envoyer un lien de téléchargement direct depuis mon WhatsApp'}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                    {locale === 'en'
                      ? 'Opens the client chat on your own WhatsApp number with your message and a direct 1-click download link for the PDF document.'
                      : 'Ouvre la discussion du client depuis votre propre numéro WhatsApp avec votre message et un lien de téléchargement direct du document PDF.'}
                  </p>
                </div>
                <Button
                  fullWidth
                  variant="secondary"
                  size="md"
                  onClick={handleOwnWhatsAppLinkSend}
                  isLoading={sendingLinkWhatsApp}
                  disabled={sendingWhatsApp}
                >
                  {locale === 'en'
                    ? 'Open my WhatsApp with direct PDF link'
                    : 'Ouvrir mon WhatsApp avec le lien PDF'}
                </Button>
              </div>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                disabled={sendingWhatsApp || sendingLinkWhatsApp}
                onClick={() => setWhatsAppConfirmOpen(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
              >
                {locale === 'en' ? 'Cancel' : 'Annuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {documentId && (
        <EmailSendSheet
          open={emailSheetOpen}
          onOpenChange={setEmailSheetOpen}
          documentId={documentId}
          defaultEmail={email || clientEmail || null}
          defaultLocale={effectiveLocale}
          defaultMessage={message}
          onSent={onSent}
        />
      )}
    </>
  );
}
