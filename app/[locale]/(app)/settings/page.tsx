'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { useCurrentUser } from '@/components/providers/SessionProvider';

export default function SettingsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const { user, refresh } = useCurrentUser();

  const [savingMode, setSavingMode] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleModeChange = async (newMode: 'ECOMMERCE' | 'PRESTATION') => {
    setSavingMode(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
      if (res.ok) {
        await refresh();
      }
    } catch {}
    setSavingMode(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await refresh();
      router.push(`/${locale}/login` as Route);
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('settings.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Préférences de l&apos;application et profil utilisateur.
        </p>
      </div>

      {/* Profile summary */}
      <Card className="p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-900">
            {user?.name || user?.businessName || user?.phone}
          </div>
          <div className="text-xs text-slate-500">{user?.phone}</div>
        </div>
        <Link href={`/${locale}/upgrade` as Route}>
          <Button size="sm" variant="outline">
            {user?.proUntil ? 'Gérer Pro' : 'Passer Pro'}
          </Button>
        </Link>
      </Card>

      {/* Language */}
      <Card className="p-4 space-y-2">
        <label className="block text-sm font-semibold text-slate-800">
          {t('settings.language')}
        </label>
        <p className="text-xs text-slate-500">
          Choisissez la langue d&apos;affichage de MyCashBill.
        </p>
        <div className="pt-1">
          <LocaleSwitcher />
        </div>
      </Card>

      {/* Mode selection */}
      <Card className="p-4 space-y-2">
        <label className="block text-sm font-semibold text-slate-800">
          {t('settings.mode')}
        </label>
        <p className="text-xs text-slate-500">
          Adapte la terminologie et les modèles de facturation.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={savingMode}
            onClick={() => handleModeChange('ECOMMERCE')}
            className={`rounded-lg border p-3 text-left text-xs transition ${
              user?.mode === 'ECOMMERCE'
                ? 'border-sage-600 bg-sage-50 text-sage-900 font-semibold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t('auth.register.modeEcommerce')}
          </button>
          <button
            type="button"
            disabled={savingMode}
            onClick={() => handleModeChange('PRESTATION')}
            className={`rounded-lg border p-3 text-left text-xs transition ${
              user?.mode === 'PRESTATION'
                ? 'border-sage-600 bg-sage-50 text-sage-900 font-semibold'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t('auth.register.modePrestation')}
          </button>
        </div>
      </Card>

      {/* Navigation links */}
      <Card className="divide-y divide-slate-100 overflow-hidden">
        <Link
          href={`/${locale}/settings/business` as Route}
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
        >
          <div>
            <div className="font-semibold text-sm text-slate-900">
              {t('settings.business')}
            </div>
            <div className="text-xs text-slate-500">
              {t('settings.businessHelp')}
            </div>
          </div>
          <span className="text-slate-400 text-sm">&rarr;</span>
        </Link>

        <Link
          href={`/${locale}/devices` as Route}
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
        >
          <div>
            <div className="font-semibold text-sm text-slate-900">
              {t('devices.title')}
            </div>
            <div className="text-xs text-slate-500">
              Sessions actives et autorisations d&apos;appareils
            </div>
          </div>
          <span className="text-slate-400 text-sm">&rarr;</span>
        </Link>

        <Link
          href={`/${locale}/referrals` as Route}
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
        >
          <div>
            <div className="font-semibold text-sm text-slate-900">
              {t('referrals.title')}
            </div>
            <div className="text-xs text-slate-500">
              Gagnez des jours Pro en partageant votre lien
            </div>
          </div>
          <span className="text-slate-400 text-sm">&rarr;</span>
        </Link>
      </Card>

      {/* Logout */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={loggingOut}
          loading={loggingOut}
          onClick={handleLogout}
          className="w-full text-red-600 border-red-200 hover:bg-red-50 thumb-zone"
        >
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
}

