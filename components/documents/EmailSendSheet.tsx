'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/device/haptics';

export function EmailSendSheet({
  open,
  onOpenChange,
  documentId,
  defaultEmail,
  defaultLocale,
  defaultMessage,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  defaultEmail: string | null;
  defaultLocale: 'fr' | 'en';
  defaultMessage?: string;
  /** Appelé uniquement après un envoi réussi. */
  onSent?: () => void;
}) {
  const t = useTranslations('documents.email');
  const toast = useToast();
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [message, setMessage] = useState(defaultMessage ?? '');
  const [locale, setLocale] = useState<'fr' | 'en'>(defaultLocale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = email.trim().length > 0 && !loading;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    setLoading(true);
    setError(null);
    haptic('medium');
    try {
      const res = await fetch(`/api/documents/${documentId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ to: email.trim(), customMessage: message.trim() || null, locale }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? t('sendError'));
        haptic('heavy');
        return;
      }
      toast.show(t('sendSuccess'), 'success');
      onSent?.();
      onOpenChange(false);
    } catch {
      setError(t('sendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSend} className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('title')}</h2>
          <p className="mt-1 text-sm text-slate-600">{t('subtitle')}</p>
        </div>

        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="send"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
        />

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-slate-700">{t('localeLabel')}</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(['fr', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={locale === l}
                onClick={() => setLocale(l)}
                className={`min-h-11 rounded-lg text-sm font-semibold transition ${
                  locale === l ? 'bg-sage-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="email-message" className="mb-1.5 block text-[13px] font-medium text-slate-700">
            {t('messageLabel')}
          </label>
          <textarea
            id="email-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder={t('messagePlaceholder')}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-[16px] sm:text-sm text-ink focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-5 bg-white/95 px-5 pb-1 pt-2 backdrop-blur">
          <Button
            type="submit"
            fullWidth
            size="lg"
            className="min-h-12"
            isLoading={loading}
            disabled={!canSend}
          >
            {t('send')}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
