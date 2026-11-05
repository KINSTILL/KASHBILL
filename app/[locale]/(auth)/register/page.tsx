'use client';

import { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { getOrCreateDeviceId, getDeviceName } from '@/lib/device/client-id';
import { useCurrentUser } from '@/components/providers/SessionProvider';

function RegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'fr';
  const { refresh } = useCurrentUser();

  const refParam = searchParams.get('ref') || '';

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin !== confirmPin) {
      setError(t('auth.register.pinMismatch'));
      return;
    }

    if (!acceptTerms) {
      setError(t('auth.register.acceptTermsRequired'));
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
          phone,
          pin,
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

      const data = await res.json();
      const errCode = data.code || data.error?.code;
      const errMsg = data.message || data.error?.message;

      if (!res.ok) {
        if (errCode === 'RATE_LIMITED') {
          setError(t('auth.errors.rateLimited'));
          return;
        }
        setError(errMsg || t('auth.errors.internal'));
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
      setError(t('auth.errors.internal'));
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
    const blob = new Blob(
      [
        `Codes de récupération CashBill\n`,
        `Numéro: ${phone}\n`,
        `Date: ${new Date().toISOString()}\n\n`,
        recoveryCodes.join('\n'),
        `\n\nConservez ces codes précieusement.`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('auth.recoveryCodes.downloadFilename');
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
      <Card className="p-6 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('auth.register.title')}
          </h1>
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
              {t('auth.register.phone')} *
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-slate-700"
              >
                {t('auth.register.pin')} *
              </label>
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
            <div>
              <label
                htmlFor="confirmPin"
                className="block text-sm font-medium text-slate-700"
              >
                {t('auth.register.confirmPin')} *
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

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              {t('auth.register.name')} ({t('common.optional')})
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-medium text-slate-700"
            >
              {t('auth.register.businessName')} ({t('common.optional')})
            </label>
            <Input
              id="businessName"
              name="businessName"
              type="text"
              placeholder="Ex: Yaoundé Boutique"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-slate-700"
            >
              {t('auth.register.city')} ({t('common.optional')})
            </label>
            <Input
              id="city"
              name="city"
              type="text"
              placeholder="Ex: Douala, Yaoundé..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('auth.register.mode')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('ECOMMERCE')}
                className={`rounded-lg border p-3 text-left text-xs transition ${
                  mode === 'ECOMMERCE'
                    ? 'border-sage-600 bg-sage-50 text-sage-900 font-semibold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t('auth.register.modeEcommerce')}
              </button>
              <button
                type="button"
                onClick={() => setMode('PRESTATION')}
                className={`rounded-lg border p-3 text-left text-xs transition ${
                  mode === 'PRESTATION'
                    ? 'border-sage-600 bg-sage-50 text-sage-900 font-semibold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t('auth.register.modePrestation')}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="refCode"
              className="block text-sm font-medium text-slate-700"
            >
              {t('referrals.title')} ({t('common.optional')})
            </label>
            <Input
              id="refCode"
              type="text"
              maxLength={8}
              placeholder="Code de parrainage"
              value={referredByCode}
              onChange={(e) => setReferredByCode(e.target.value)}
              className="mt-1 uppercase tracking-widest"
            />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              id="terms"
              name="acceptTerms"
              type="checkbox"
              required
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-sage-600 focus:ring-sage-500"
            />
            <label htmlFor="terms" className="text-xs text-slate-600 leading-tight">
              {t('auth.register.acceptTerms')}
            </label>
          </div>

          <Button
            type="submit"
            disabled={
              loading ||
              phone.trim().length === 0 ||
              pin.length < 6 ||
              confirmPin.length < 6 ||
              !acceptTerms
            }
            loading={loading}
            className="w-full thumb-zone mt-4"
          >
            {t('auth.register.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {t('auth.register.hasAccount')}{' '}
          <Link
            href={`/${locale}/login` as Route}
            className="font-medium text-sage-600 hover:text-sage-700"
          >
            {t('auth.register.login')}
          </Link>
        </div>
      </Card>

      {/* Recovery codes non-dismissible sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={() => {}}
        title={t('auth.recoveryCodes.title')}
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
            {t('auth.recoveryCodes.warning')}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {recoveryCodes.map((code, index) => (
              <div
                key={index}
                className="rounded-lg bg-slate-100 p-2 text-center font-mono text-sm font-semibold text-slate-800 tracking-wider border border-slate-200"
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
              {copied ? t('common.success') : t('auth.recoveryCodes.copyAll')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleDownloadCodes}
            >
              {t('auth.recoveryCodes.download')}
            </Button>
          </div>

          <Button
            type="button"
            variant="primary"
            className="w-full thumb-zone"
            onClick={handleFinishRegistration}
          >
            {t('auth.recoveryCodes.saved')}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Chargement...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

