'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/device/client-id';
import { useCurrentUser } from '@/components/providers/SessionProvider';

interface ActiveDevice {
  deviceId: string;
  userAgent: string | null;
  lastSeenAt: string;
  isCurrent: boolean;
}

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const { refresh } = useCurrentUser();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Device limit sheet
  const [deviceLimitSheetOpen, setDeviceLimitSheetOpen] = useState(false);
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const deviceId = getOrCreateDeviceId();
      const deviceName = getDeviceName();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          phone,
          pin,
          deviceId,
          deviceName,
        }),
      });

      const data = await res.json();
      const errCode = data.code || data.error?.code;
      const errMsg = data.message || data.error?.message;
      const errDetails = data.details || data.error?.details;

      if (!res.ok) {
        if (errCode === 'DEVICE_LIMIT_REACHED') {
          setActiveDevices(errDetails?.activeDevices || []);
          setDeviceLimitSheetOpen(true);
          return;
        }

        if (errCode === 'RATE_LIMITED') {
          setError(t('auth.errors.rateLimited'));
          return;
        }

        if (errCode === 'INVALID_CREDENTIALS') {
          setError(t('auth.errors.invalidCredentials'));
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
          {t('auth.login.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('auth.login.subtitle')}
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
            {t('auth.login.phone')}
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="699 00 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-slate-700"
            >
              {t('auth.login.pin')}
            </label>
            <Link
              href={`/${locale}/recovery` as Route}
              className="text-xs font-medium text-sage-600 hover:text-sage-700"
            >
              {t('auth.login.forgotPin')}
            </Link>
          </div>
          <Input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            required
            placeholder="••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="mt-1 text-center tracking-widest"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || phone.trim().length === 0 || pin.length < 6}
          loading={loading}
          className="w-full thumb-zone"
        >
          {t('auth.login.submit')}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        {t('auth.login.noAccount')}{' '}
        <Link
          href={`/${locale}/register` as Route}
          className="font-medium text-sage-600 hover:text-sage-700"
        >
          {t('auth.login.createAccount')}
        </Link>
      </div>

      {/* Device limit resolution sheet */}
      <Sheet
        open={deviceLimitSheetOpen}
        onOpenChange={setDeviceLimitSheetOpen}
        title={t('auth.errors.deviceLimitReached')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {t('auth.errors.deviceLimitHelp')}
          </p>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {activeDevices.map((dev, idx) => (
              <div key={idx} className="p-3 text-sm">
                <div className="font-medium text-slate-800">
                  {dev.userAgent || 'Navigateur'}
                </div>
                <div className="text-xs text-slate-400">
                  {t('devices.lastSeen')}:{' '}
                  {new Date(dev.lastSeenAt).toLocaleString(locale)}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500">
            Pour remplacer vos appareils par ce nouveau téléphone, utilisez votre code de secours.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setDeviceLimitSheetOpen(false);
                router.push(`/${locale}/recovery` as Route);
              }}
            >
              {t('auth.recovery.title')}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDeviceLimitSheetOpen(false)}
            >
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Sheet>
    </Card>
  );
}

