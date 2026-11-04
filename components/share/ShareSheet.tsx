'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { haptic } from '@/lib/device/haptics';
import {
  loadSharePrefs,
  saveSharePrefs,
  saveCustomMessage,
  clearCustomMessage,
  getShareGroup,
  type ShareTone,
  type ShareDistance,
} from '@/lib/share/storage';
import { resolveShareMessage } from '@/lib/share/messages';
import { buildWhatsAppUrl, shareNative } from '@/lib/share/whatsapp';
import type { DocType } from '@prisma/client';

export type ShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType: DocType;
  clientName: string;
  clientPhone: string | null;
  pdfBlob: Blob;
  documentNumber: string;
  documentId?: string;
  onSent: () => void;
};

export function ShareSheet({
  open,
  onOpenChange,
  docType,
  clientPhone,
  pdfBlob,
  documentNumber,
  documentId,
  onSent,
}: ShareSheetProps) {
  const tRoot = useTranslations();
  const t = useTranslations('share');
  const locale = useLocale() as 'fr' | 'en';
  const group = getShareGroup(docType);

  const [prefs, setPrefs] = useState(loadSharePrefs());
  const [message, setMessage] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        setCanShare(navigator.canShare({ files: [new File([pdfBlob], 'x.pdf', { type: 'application/pdf' })] }));
      } catch {
        setCanShare(false);
      }
    }
  }, [pdfBlob]);

  useEffect(() => {
    if (!open) return;
    const loaded = loadSharePrefs();
    setPrefs(loaded);
    const custom = loaded.customMessages[group];
    if (custom) {
      setMessage(custom);
      setIsCustom(true);
    } else {
      setMessage(resolveShareMessage(tRoot, group, loaded.lastTone, loaded.lastDistance, locale));
      setIsCustom(false);
    }
  }, [open, group, locale, tRoot]);

  const applyToneDistance = (tone: ShareTone, distance: ShareDistance) => {
    haptic('light');
    setPrefs({ ...prefs, lastTone: tone, lastDistance: distance });
    if (!isCustom) {
      setMessage(resolveShareMessage(tRoot, group, tone, distance, locale));
    }
  };

  const handleEdit = (value: string) => {
    setMessage(value);
    setIsCustom(true);
  };

  const handleReset = () => {
    clearCustomMessage(group);
    setIsCustom(false);
    setMessage(resolveShareMessage(tRoot, group, prefs.lastTone, prefs.lastDistance, locale));
  };

  const finalize = () => {
    const nextPrefs = { ...prefs };
    if (isCustom) {
      saveCustomMessage(group, message);
    } else {
      saveSharePrefs(nextPrefs);
    }
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
    if (!clientPhone) return;
    finalize();
    const url = buildWhatsAppUrl(clientPhone, message);
    window.open(url, '_blank');
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
      alert(t('modal.shareNotSupported'));
    }
  };

  const handleDownload = () => {
    finalize();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  return (
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
                onClick={() => applyToneDistance(tone, prefs.lastDistance)}
                className={`rounded-lg border p-2 text-sm font-medium ${
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

        {/* Tu/Vous (masqué en EN) */}
        {locale === 'fr' && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{t('modal.distance.label')}</p>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
              {(['tu', 'vous'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => applyToneDistance(prefs.lastTone, d)}
                  className={`px-3 py-1 rounded ${prefs.lastDistance === d ? 'bg-sage-500 text-white' : ''}`}
                >
                  {t(`modal.distance.${d}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message éditable */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">{t('modal.message.label')}</label>
            {isCustom && (
              <button onClick={handleReset} className="text-xs text-sage-700 underline">
                {t('modal.message.resetButton')}
              </button>
            )}
          </div>
          <textarea
            value={message}
            onChange={(e) => handleEdit(e.target.value)}
            maxLength={1500}
            rows={5}
            className="thumb-zone w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">{t('modal.message.hint')}</p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <Button fullWidth variant="whatsapp" size="lg" onClick={handleWhatsApp} disabled={!clientPhone}>
            {t('modal.actions.whatsapp')}
          </Button>
          {canShare && (
            <Button fullWidth variant="secondary" onClick={handleNativeShare}>
              {t('modal.actions.share')}
            </Button>
          )}
          <Button fullWidth variant="ghost" onClick={handleDownload}>
            {t('modal.actions.download')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

