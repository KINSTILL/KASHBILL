'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import {
  ShieldCheck,
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
} from '@/components/ui/icons';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/device/client-id';
import { useCurrentUser } from '@/components/providers/SessionProvider';

interface ActiveDevice {
  deviceId: string;
  userAgent: string | null;
  lastSeenAt: string;
  isCurrent: boolean;
}

/** Formate la saisie locale camerounaise : 6XX XX XX XX (9 chiffres). */
function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 9);
  const parts: string[] = [];
  if (cleaned.length > 0) parts.push(cleaned.slice(0, 3));
  if (cleaned.length > 3) parts.push(cleaned.slice(3, 5));
  if (cleaned.length > 5) parts.push(cleaned.slice(5, 7));
  if (cleaned.length > 7) parts.push(cleaned.slice(7, 9));
  return parts.join(' ');
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

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Device limit sheet
  const [deviceLimitSheetOpen, setDeviceLimitSheetOpen] = useState(false);
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);

  const cleanPhone = phone.replace(/\s+/g, '');
  const isFormValid = cleanPhone.length === 9 && pin.every((d) => d !== '');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
    if (errorMessage) setErrorMessage(null);
  };

  const executeLogin = (rawPhone: string, fullPin: string) => {
    const phoneDigits = rawPhone.replace(/\s+/g, '');

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
          error?: { code?: string; message?: string; details?: { activeDevices?: ActiveDevice[] } };
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
        pinRefs.current[0]?.focus();
      }
    });
  };

  const handlePinChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextPin = [...pin];
    nextPin[index] = digit;
    setPin(nextPin);
    if (errorMessage) setErrorMessage(null);

    if (digit && index < PIN_LENGTH - 1) {
      pinRefs.current[index + 1]?.focus();
    }

    if (digit && index === PIN_LENGTH - 1 && nextPin.every((d) => d !== '')) {
      executeLogin(phone, nextPin.join(''));
    }
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        pinRefs.current[index - 1]?.focus();
      } else {
        const nextPin = [...pin];
        nextPin[index] = '';
        setPin(nextPin);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      pinRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, PIN_LENGTH);
    if (!pasted) return;

    const nextPin = [...pin];
    for (let i = 0; i < pasted.length; i++) {
      nextPin[i] = pasted[i] ?? '';
    }
    setPin(nextPin);

    const targetIdx = Math.min(pasted.length, PIN_LENGTH - 1);
    pinRefs.current[targetIdx]?.focus();

    if (pasted.length === PIN_LENGTH) {
      executeLogin(phone, pasted);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(phone, pin.join(''));
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
        {/* Numero de telephone - prefixe Cameroun fixe */}
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {t('login.phone_label')}
          </label>
          <div className="flex rounded-xl border border-slate-300 bg-white transition-all focus-within:border-sage-600 focus-within:ring-2 focus-within:ring-sage-600/20">
            <span className="inline-flex items-center gap-1.5 rounded-l-xl border-r border-slate-200 bg-slate-50/80 px-3.5 text-sm font-semibold text-slate-700 select-none">
              <span className="text-base" role="img" aria-label="Cameroun">
                🇨🇲
              </span>
              <span>+237</span>
            </span>
            <div className="relative flex flex-1 items-center">
              <Smartphone className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder={t('login.phone_placeholder')}
                value={phone}
                onChange={handlePhoneChange}
                disabled={isPending}
                required
                className="w-full rounded-r-xl bg-transparent py-3 pl-10 pr-4 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Code PIN - 6 cases */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              {t('login.pin_label')}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-sage-600 transition-colors hover:text-sage-700"
                aria-label={showPin ? t('login.pin_hide') : t('login.pin_show')}
              >
                {showPin ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>{t('login.pin_hide')}</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>{t('login.pin_show')}</span>
                  </>
                )}
              </button>
              <Link
                href={`/${locale}/recovery` as Route}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
              >
                {t('login.forgot_pin')}
              </Link>
            </div>
          </div>

          <div
            className="grid grid-cols-6 gap-2 sm:gap-2.5"
            onPaste={handlePinPaste}
          >
            {pin.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  pinRefs.current[idx] = el;
                }}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={isPending}
                onChange={(e) => handlePinChange(idx, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(idx, e)}
                autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                aria-label={`Chiffre ${idx + 1}`}
                className="aspect-square w-full rounded-xl border border-slate-300 bg-slate-50 text-center text-lg font-bold text-slate-900 transition-all focus:border-sage-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sage-600/20 disabled:opacity-50"
              />
            ))}
          </div>
        </div>

        {/* CTA principal */}
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

      {/* Lien creation de compte */}
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

      {/* Feuille de resolution - limite d'appareils atteinte */}
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
