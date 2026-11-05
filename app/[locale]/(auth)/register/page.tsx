'use client';

import { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { PinInput } from '@/components/auth/PinInput';
import { AlertCircle, Loader2, ArrowRight, ShieldCheck } from '@/components/ui/icons';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/device/client-id';
import { useCurrentUser } from '@/components/providers/SessionProvider';

const PIN_LENGTH = 6;

function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'fr';
  const { refresh } = useCurrentUser();

  const refParam = searchParams.get('ref') || '';

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [showPin, setShowPin] = useState(false);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [mode, setMode] = useState<'ECOMMERCE' | 'PRESTATION'>('ECOMMERCE');
  const [referredByCode, setReferredByCode] = useState(refParam);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recovery codes sheet
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanPhone = phone.replace(/\s+/g, '');
  const pinString = pin.join('');
  const confirmString = confirmPin.join('');
  const isFormValid =
    cleanPhone.length === 9 &&
    pinString.length === PIN_LENGTH &&
    confirmString.length === PIN_LENGTH &&
    acceptTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cleanPhone.length !== 9) {
      setError(t('register.error_phone_invalid'));
      return;
    }
    if (pinString.length !== PIN_LENGTH) {
      setError(t('register.error_pin_incomplete'));
      return;
    }
    if (pinString !== confirmString) {
      setError(t('register.pinMismatch'));
      return;
    }
    if (!acceptTerms) {
      setError(t('register.acceptTermsRequired'));
      return;
    }

    setLoading(true);

    try {
      const deviceId = getOrCreateDeviceId();
      const deviceName = getDeviceName();

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          phone: `+237${cleanPhone}`,
          pin: pinString,
          name: name.trim() || undefined,
          businessName: businessName.trim() || undefined,
          city: city.trim() || undefined,
          mode,
          locale: locale.toUpperCase(),
          deviceId,
          deviceName,
          referredByCode: referredByCode.trim().toUpperCase() || undefined,
        }),
      });

      const data: {
        code?: string;
        message?: string;
        recoveryCodes?: string[];
        error?: { code?: string; message?: string };
      } = await res.json();
      const errCode = data.code || data.error?.code;
      const errMsg = data.message || data.error?.message;

      if (!res.ok) {
        if (errCode === 'RATE_LIMITED') {
          setError(t('errors.rateLimited'));
          return;
        }
        setError(errMsg || t('errors.internal'));
        return;
      }

      if (Array.isArray(data.recoveryCodes) && data.recoveryCodes.length > 0) {
        setRecoveryCodes(data.recoveryCodes);
        setSheetOpen(true);
      } else {
        await refresh();
        router.push(`/${locale}/dashboard` as Route);
      }
    } catch {
      setError(t('errors.internal'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownloadCodes = () => {
    const isEn = locale === 'en';
    const blob = new Blob(
      [
        isEn
          ? `MyCashBill Recovery Codes\nNumber: ${phone}\nDate: ${new Date().toISOString()}\n\n${recoveryCodes.join('\n')}\n\nKeep these codes safe.`
          : `Codes de récupération MyCashBill\nNuméro: ${phone}\nDate: ${new Date().toISOString()}\n\n${recoveryCodes.join('\n')}\n\nConservez ces codes précieusement.`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('recoveryCodes.downloadFilename');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinishRegistration = async () => {
    setSheetOpen(false);
    await refresh();
    router.push(`/${locale}/dashboard` as Route);
    router.refresh();
  };

  return (
    <>
      <Card className="p-6 shadow-md sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('register.title')}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {t('register.subtitle')}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm font-medium leading-snug text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identifiants */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sage-700">
              {t('register.identity_title')}
            </h2>

            <PhoneInput
              label={t('register.phone_label')}
              placeholder={t('register.phone_placeholder')}
              value={phone}
              onChange={(v) => {
                setPhone(v);
                if (error) setError(null);
              }}
              disabled={loading}
              required
            />

            <div>
              <PinInput
                label={t('register.pin_label')}
                value={pin}
                onChange={(next) => {
                  setPin(next);
                  if (error) setError(null);
                }}
                show={showPin}
                onToggleShow={() => setShowPin((v) => !v)}
                showLabel={t('register.pin_show')}
                hideLabel={t('register.pin_hide')}
                disabled={loading}
              />
              <p className="mt-1.5 text-xs text-slate-500">{t('register.pin_hint')}</p>
            </div>

            <PinInput
              label={t('register.pin_confirm_label')}
              value={confirmPin}
              onChange={(next) => {
                setConfirmPin(next);
                if (error) setError(null);
              }}
              show={showPin}
              onToggleShow={() => setShowPin((v) => !v)}
              showLabel={t('register.pin_show')}
              hideLabel={t('register.pin_hide')}
              disabled={loading}
            />

            {/* Feedback confirmation immédiat */}
            {confirmString.length === PIN_LENGTH && confirmString !== pinString && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {t('register.pinMismatch')}
              </p>
            )}
          </section>

          {/* Informations professionnelles (facultatif) */}
          <section className="space-y-4 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-sage-700">
                {t('register.profile_title')}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {t('register.optional_badge')}
              </span>
            </div>

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                {t('register.name_label')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={t('register.name_placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:border-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-600/20 disabled:opacity-50 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                {t('register.business_name_label')}
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                autoComplete="organization"
                placeholder={t('register.business_name_placeholder')}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:border-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-600/20 disabled:opacity-50 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                {t('register.city_label')}
              </label>
              <input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                placeholder={t('register.city_placeholder')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:border-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-600/20 disabled:opacity-50 sm:text-sm"
              />
            </div>
          </section>

          {/* Mode d'utilisation */}
          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sage-700">
              {t('register.mode_title')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('ECOMMERCE')}
                aria-pressed={mode === 'ECOMMERCE'}
                className={`rounded-xl border p-3.5 text-left text-sm transition-all ${
                  mode === 'ECOMMERCE'
                    ? 'border-sage-600 bg-sage-50 font-semibold text-sage-900 ring-2 ring-sage-600/20'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {t('register.modeEcommerce')}
              </button>
              <button
                type="button"
                onClick={() => setMode('PRESTATION')}
                aria-pressed={mode === 'PRESTATION'}
                className={`rounded-xl border p-3.5 text-left text-sm transition-all ${
                  mode === 'PRESTATION'
                    ? 'border-sage-600 bg-sage-50 font-semibold text-sage-900 ring-2 ring-sage-600/20'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {t('register.modePrestation')}
              </button>
            </div>
            <p className="text-xs text-slate-500">{t('register.mode_hint')}</p>
          </section>

          {/* Code de parrainage */}
          <section className="space-y-2 border-t border-slate-100 pt-5">
            <label
              htmlFor="refCode"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              {t('register.ref_code_label')}
            </label>
            <input
              id="refCode"
              type="text"
              maxLength={8}
              placeholder={t('register.ref_code_placeholder')}
              value={referredByCode}
              onChange={(e) => setReferredByCode(e.target.value.toUpperCase())}
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base uppercase tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal transition-all focus:border-sage-600 focus:outline-none focus:ring-2 focus:ring-sage-600/20 disabled:opacity-50 sm:text-sm"
            />
            <p className="text-xs text-slate-500">{t('register.ref_code_hint')}</p>
          </section>

          {/* CGU */}
          <div className="flex items-start gap-2.5 border-t border-slate-100 pt-5">
            <input
              id="terms"
              name="acceptTerms"
              type="checkbox"
              required
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-sage-600 focus:ring-sage-500"
            />
            <label htmlFor="terms" className="text-xs leading-relaxed text-slate-600">
              {t('register.acceptTerms')}
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="min-h-[48px] w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('register.submitting')}</span>
              </>
            ) : (
              <>
                <span>{t('register.submit_button')}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <p className="text-sm text-slate-600">
            {t('register.has_account')}{' '}
            <Link
              href={`/${locale}/login` as Route}
              className="font-semibold text-sage-600 hover:text-sage-700 hover:underline"
            >
              {t('register.login_link')}
            </Link>
          </p>
        </div>
      </Card>

      {/* Feuille des codes de récupération (non-dismissible) */}
      <Sheet
        open={sheetOpen}
        onOpenChange={() => {}}
        dismissible={false}
        title={t('recoveryCodes.title')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-800">
              {t('recoveryCodes.warning')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {recoveryCodes.map((code, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center font-mono text-sm font-semibold tracking-wider text-slate-800"
              >
                <code>{code}</code>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleCopyCodes}
            >
              {copied ? t('common.success') : t('recoveryCodes.copyAll')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleDownloadCodes}
            >
              {t('recoveryCodes.download')}
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            className="min-h-[48px] w-full"
            onClick={handleFinishRegistration}
          >
            {t('recoveryCodes.saved')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export default function RegisterPage() {
  const t = useTranslations('common');
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-slate-500">{t('loading')}</div>}
    >
      <RegisterForm />
    </Suspense>
  );
}
