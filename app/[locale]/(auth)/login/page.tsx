'use client';

import { useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { PinInput } from '@/components/auth/PinInput';
import { ShieldCheck, AlertCircle, Loader2, ArrowRight } from '@/components/ui/icons';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/device/client-id';
import { useCurrentUser } from '@/components/providers/SessionProvider';

interface ActiveDevice {
  deviceId: string;
  userAgent: string | null;
  lastSeenAt: string;
  isCurrent: boolean;
}

const PIN_LENGTH = 6;

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const { refresh } = useCurrentUser();

  const [isPending, startTransition] = useTransition();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Device limit sheet
  const [deviceLimitSheetOpen, setDeviceLimitSheetOpen] = useState(false);
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);

  const cleanPhone = phone.replace(/\s+/g, '');
  const isFormValid = cleanPhone.length === 9 && pin.every((d) => d !== '');

  const executeLogin = (fullPin: string) => {
    const phoneDigits = phone.replace(/\s+/g, '');

    if (phoneDigits.length < 9) {
      setErrorMessage(t('login.error_phone_invalid'));
      return;
    }
    if (fullPin.length !== PIN_LENGTH) {
      setErrorMessage(t('login.error_pin_incomplete'));
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      try {
        const deviceId = getOrCreateDeviceId();
        const deviceName = getDeviceName();

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'fetch',
          },
          body: JSON.stringify({
            phone: `+237${phoneDigits}`,
            pin: fullPin,
            deviceId,
            deviceName,
          }),
        });

        const data: {
          code?: string;
          message?: string;
          details?: { activeDevices?: ActiveDevice[] };
          error?: {
            code?: string;
            message?: string;
            details?: { activeDevices?: ActiveDevice[] };
          };
        } = await res.json();
        const errCode = data.code || data.error?.code;
        const errDetails = data.details || data.error?.details;

        if (!res.ok) {
          if (errCode === 'DEVICE_LIMIT_REACHED') {
            setActiveDevices(errDetails?.activeDevices || []);
            setDeviceLimitSheetOpen(true);
            return;
          }
          if (errCode === 'RATE_LIMITED') {
            setErrorMessage(t('errors.rateLimited'));
            return;
          }
          if (errCode === 'INVALID_CREDENTIALS') {
            setErrorMessage(t('login.error_default'));
            return;
          }
          const serverMessage: string =
            data.message || data.error?.message || t('login.error_default') || '';
          setErrorMessage(serverMessage);
          return;
        }

        await refresh();
        router.push(`/${locale}/dashboard` as Route);
        router.refresh();
      } catch {
        setErrorMessage(t('login.error_default'));
        setPin(Array(PIN_LENGTH).fill(''));
      }
    });
  };

  const handlePinChange = (next: string[]) => {
    setPin(next);
    if (errorMessage) setErrorMessage(null);

    // Auto-submit dès que les 6 chiffres sont saisis
    if (next.every((d) => d !== '')) {
      executeLogin(next.join(''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(pin.join(''));
  };

  return (
    <Card className="p-6 shadow-md sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('login.title')}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {t('login.subtitle')}
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm font-medium leading-snug text-red-800">
            {errorMessage}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PhoneInput
          label={t('login.phone_label')}
          placeholder={t('login.phone_placeholder')}
          value={phone}
          onChange={(v) => {
            setPhone(v);
            if (errorMessage) setErrorMessage(null);
          }}
          disabled={isPending}
          required
        />

        <div>
          <PinInput
            label={t('login.pin_label')}
            value={pin}
            onChange={handlePinChange}
            show={showPin}
            onToggleShow={() => setShowPin((v) => !v)}
            showLabel={t('login.pin_show')}
            hideLabel={t('login.pin_hide')}
            disabled={isPending}
          />
          <div className="mt-2 text-right">
            <Link
              href={`/${locale}/recovery` as Route}
              className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
            >
              {t('login.forgot_pin')}
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending || !isFormValid}
          className="min-h-[48px] w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('login.submitting')}</span>
            </>
          ) : (
            <>
              <span>{t('login.submit_button')}</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6 text-center">
        <p className="text-sm text-slate-600">
          {t('login.no_account')}{' '}
          <Link
            href={`/${locale}/register` as Route}
            className="font-semibold text-sage-600 hover:text-sage-700 hover:underline"
          >
            {t('login.create_account')}
          </Link>
        </p>
      </div>

      <Sheet
        open={deviceLimitSheetOpen}
        onOpenChange={setDeviceLimitSheetOpen}
        title={t('errors.deviceLimitReached')}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{t('errors.deviceLimitHelp')}</p>

          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {activeDevices.map((dev, idx) => (
              <div key={idx} className="p-3 text-sm">
                <div className="font-medium text-slate-800">
                  {dev.userAgent || 'Navigateur'}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(dev.lastSeenAt).toLocaleString(locale)}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                setDeviceLimitSheetOpen(false);
                router.push(`/${locale}/recovery` as Route);
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              {t('recovery.title')}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDeviceLimitSheetOpen(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Sheet>
    </Card>
  );
}
