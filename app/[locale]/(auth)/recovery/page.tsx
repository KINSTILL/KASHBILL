'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { getOrCreateDeviceId } from '@/lib/device/client-id';
import { useCurrentUser } from '@/components/providers/SessionProvider';

export default function RecoveryPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const { refresh } = useCurrentUser();

  const [phone, setPhone] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPin !== confirmPin) {
      setError(t('auth.register.pinMismatch'));
      return;
    }

    setLoading(true);

    try {
      const deviceId = getOrCreateDeviceId();

      const res = await fetch('/api/auth/recovery/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          phone,
          recoveryCode: recoveryCode.trim(),
          newPin,
          deviceId,
        }),
      });

      const data = await res.json();
      const errCode = data.code || data.error?.code;
      const errMsg = data.message || data.error?.message;

      if (!res.ok) {
        if (errCode === 'RECOVERY_CODE_INVALID') {
          setError(t('auth.errors.recoveryCodeInvalid'));
          return;
        }
        if (errCode === 'RATE_LIMITED') {
          setError(t('auth.errors.rateLimited'));
          return;
        }
        setError(errMsg || t('auth.errors.internal'));
        return;
      }

      await refresh();
      router.push(`/${locale}/dashboard` as Route);
      router.refresh();
    } catch {
      setError(t('auth.errors.internal'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 shadow-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('auth.recovery.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('auth.recovery.subtitle')}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700"
          >
            {t('auth.recovery.phone')}
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="699 00 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="recoveryCode"
            className="block text-sm font-medium text-slate-700"
          >
            {t('auth.recovery.code')}
          </label>
          <Input
            id="recoveryCode"
            name="recoveryCode"
            type="text"
            required
            placeholder="ABCD-1234"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
            className="mt-1 font-mono tracking-widest text-center uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="newPin"
              className="block text-sm font-medium text-slate-700"
            >
              {t('auth.recovery.newPin')}
            </label>
            <Input
              id="newPin"
              name="newPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="••••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="mt-1 text-center tracking-widest"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPin"
              className="block text-sm font-medium text-slate-700"
            >
              {t('auth.register.confirmPin')}
            </label>
            <Input
              id="confirmPin"
              name="confirmPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="••••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="mt-1 text-center tracking-widest"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={
            loading ||
            phone.trim().length === 0 ||
            recoveryCode.trim().length === 0 ||
            newPin.length < 6 ||
            confirmPin.length < 6
          }
          loading={loading}
          className="w-full thumb-zone"
        >
          {t('auth.recovery.submit')}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        <Link
          href={`/${locale}/login` as Route}
          className="font-medium text-sage-600 hover:text-sage-700"
        >
          {t('common.back')} {t('auth.register.login')}
        </Link>
      </div>
    </Card>
  );
}

