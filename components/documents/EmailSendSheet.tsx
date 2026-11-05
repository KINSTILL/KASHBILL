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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  defaultEmail: string | null;
  defaultLocale: 'fr' | 'en';
}) {
  const t = useTranslations('documents.email');
  const toast = useToast();
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [message, setMessage] = useState('');
  const [locale, setLocale] = useState<'fr' | 'en'>(defaultLocale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    haptic('medium');
    try {
      const res = await fetch(`/api/documents/${documentId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ to: email, customMessage: message.trim() || null, locale }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? t('sendError'));
        haptic('heavy');
        return;
      }
      toast.show(t('sendSuccess'), 'success');
      onOpenChange(false);
    } catch {
      setError(t('sendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <h2 className="text-lg font-bold">{t('title')}</h2>
        <p className="text-sm text-slate-600">{t('subtitle')}</p>
        <Input
          type="email"
          inputMode="email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">{t('localeLabel')}</p>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
            {(['fr', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                className={`rounded px-3 py-1 ${locale === l ? 'bg-sage-500 text-white' : ''}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t('messageLabel')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder={t('messagePlaceholder')}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm"
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button
          fullWidth
          size="lg"
          onClick={handleSend}
          isLoading={loading}
          disabled={!email || loading}
        >
          {t('send')}
        </Button>
      </div>
    </Sheet>
  );
}
