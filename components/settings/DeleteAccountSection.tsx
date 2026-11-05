'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { PinInput } from '@/components/auth/PinInput';
import { AlertCircle } from '@/components/ui/icons';
import { useCurrentUser } from '@/components/providers/SessionProvider';

const PIN_LENGTH = 6;

export function DeleteAccountSection() {
  const t = useTranslations('settings.deleteAccount');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const { user, refresh } = useCurrentUser();

  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [showPin, setShowPin] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && user.role !== 'USER') return null;

  const reset = () => {
    setPin(Array(PIN_LENGTH).fill(''));
    setShowPin(false);
    setConfirmed(false);
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    setOpen(next);
    if (!next) reset();
  };

  const canSubmit = confirmed && pin.every((d) => d !== '') && !loading;

  const handleDelete = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ pin: pin.join('') }),
      });
      if (!res.ok) {
        const data: { code?: string; error?: { code?: string } } = await res
          .json()
          .catch(() => ({}));
        const code = data.code || data.error?.code;
        if (code === 'INVALID_CREDENTIALS') setError(t('wrongPin'));
        else if (code === 'RATE_LIMITED') setError(tAuth('errors.rateLimited'));
        else setError(tAuth('errors.internal'));
        setPin(Array(PIN_LENGTH).fill(''));
        return;
      }
      await refresh();
      router.push(`/${locale}/login` as Route);
      router.refresh();
    } catch {
      setError(tAuth('errors.internal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="space-y-2 border-red-200 p-4">
        <div className="text-sm font-semibold text-red-700">{t('title')}</div>
        <p className="text-xs text-slate-500">{t('description')}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full border-red-200 text-red-600 hover:bg-red-50 thumb-zone"
        >
          {t('button')}
        </Button>
      </Card>

      <Sheet open={open} onOpenChange={handleOpenChange} title={t('confirmTitle')}>
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-xs leading-relaxed text-red-800">{t('warning')}</p>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <PinInput
            label={t('pinLabel')}
            value={pin}
            onChange={(next) => {
              setPin(next);
              if (error) setError(null);
            }}
            show={showPin}
            onToggleShow={() => setShowPin((v) => !v)}
            showLabel={tAuth('login.pin_show')}
            hideLabel={tAuth('login.pin_hide')}
            disabled={loading}
          />

          <label className="flex items-start gap-2.5 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-red-600"
            />
            <span>{t('confirmCheckbox')}</span>
          </label>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              onClick={handleDelete}
              disabled={!canSubmit}
              loading={loading}
              className="w-full bg-red-600 text-white hover:bg-red-700 thumb-zone"
            >
              {t('confirmButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="w-full"
            >
              {tCommon('cancel')}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

