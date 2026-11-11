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

  const handleWhatsApp = async () => {
    finalize();
    const url = buildWhatsAppUrl(phone, message);
    window.open(url, '_blank');
    await markDocumentSent();
    onSent();
    onOpenChange(false);
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
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">{t('modal.title')}</h2>

          {/* Tones */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('modal.tone.label')}</p>
            <div className="grid grid-cols-3 gap-2">
              {(['transparency', 'pro', 'casual'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => applyToneDistance(tone, prefs.lastTone === tone ? prefs.lastDistance : prefs.lastDistance)}
                  className={`rounded-lg border p-2 text-sm font-medium transition ${
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

          {/* Tu/Vous */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('modal.distance.label')}</p>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
              {(['tu', 'vous'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => applyToneDistance(prefs.lastTone, d)}
                  className={`rounded px-3 py-1 transition ${
                    prefs.lastDistance === d ? 'bg-sage-500 text-white' : ''
                  }`}
                >
                  {t(`modal.distance.${d}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Message éditable */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">
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
              maxLength={1500}
              rows={4}
              className="thumb-zone w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-[16px] sm:text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">{t('modal.message.hint')}</p>
          </div>

          {/* Téléphone WhatsApp du client */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('modal.clientPhone')}
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('modal.clientPhonePlaceholder')}
              className="thumb-zone w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[16px] sm:text-sm"
            />
          </div>

          {/* Email du client */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('modal.clientEmail')}
            </label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('modal.clientEmailPlaceholder')}
              className="thumb-zone w-full rounded-lg border border-slate-300 bg-white p-2.5 text-[16px] sm:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button fullWidth variant="whatsapp" size="lg" onClick={handleWhatsApp}>
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
