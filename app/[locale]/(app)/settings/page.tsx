'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  Building2,
  CreditCard,
  Smartphone,
  Gift,
  Globe,
  ShoppingBag,
  Briefcase,
  ChevronRight,
  LogOut,
  Crown,
  Languages,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { DeleteAccountSection } from '@/components/settings/DeleteAccountSection';
import { ProfileAnnouncementBox } from '@/components/ui/AnnouncementBanner';
import { AdminTestProToggle } from '@/components/admin/AdminTestProToggle';
import { WhatsAppRefreshButton } from '@/components/admin/WhatsAppRefreshButton';

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

  const displayName = user?.businessName || user?.name || user?.phone || 'Utilisateur';
  const initials = displayName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'MC';

  const isProActive = Boolean(user?.proUntil && new Date(user.proUntil) > new Date());

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* En-tête de page */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {locale === 'en'
            ? 'Application preferences and business profile.'
            : "Préférences de l'application et profil utilisateur."}
        </p>
      </div>

      {/* Annonce globale persistante jusqu'à expiration ou retrait par l'admin */}
      <ProfileAnnouncementBox />

      {/* Carte d'identité Fintech / Revolut */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-sm font-extrabold text-white shadow-sm">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-sm sm:text-base text-slate-950">
                  {displayName}
                </p>
                {isProActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 shrink-0">
                    <Crown className="h-3 w-3 text-emerald-600" />
                    PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">
                    {locale === 'en' ? 'Free' : 'Gratuit'}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">{user?.phone}</p>
            </div>
          </div>

          <Link href={`/${locale}/upgrade` as Route} className="shrink-0">
            <Button
              size="sm"
              variant={isProActive ? 'outline' : 'primary'}
              className="gap-1.5 font-semibold"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>{user?.proUntil ? 'Gérer Pro' : 'Passer Pro'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Espace Administrateur & Pilotage Plateforme */}
      {(user?.role === 'ADMIN' || user?.role === 'SUPPORT') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-amber-600">
              👑 Console Administrateur
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {user.role}
            </span>
          </div>
          <div className="divide-y divide-slate-100 rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 shadow-xs overflow-hidden">
            <Link
              href={`/${locale}/admin` as Route}
              className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-amber-100/40 transition active:bg-amber-100/60"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900">
                    Console d&apos;administration complète
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    Utilisateurs, privilèges, abonnements, factures et métriques
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>

            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-white/70">
              <div>
                <div className="font-semibold text-sm text-slate-900">
                  Mode Test de votre compte
                </div>
                <div className="text-xs text-slate-500">
                  Basculez instantanément votre compte entre Pro et Gratuit pour vos tests
                </div>
              </div>
              <AdminTestProToggle />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-white/70">
              <div>
                <div className="font-semibold text-sm text-slate-900">
                  WhatsApp Evolution (Nouveaux numéros)
                </div>
                <div className="text-xs text-slate-500">
                  Actualise le socket Baileys et synchronise les nouveaux numéros
                </div>
              </div>
              <WhatsAppRefreshButton variant="pill" showLabel={true} />
            </div>
          </div>
        </div>
      )}

      {/* Section 1 : Mon Entreprise & Abonnement */}
      <div className="space-y-2">
        <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {locale === 'en' ? 'Business & Workspace' : 'Entreprise & Espace Pro'}
        </h2>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <Link
            href={`/${locale}/settings/business` as Route}
            className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:bg-slate-100/60"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-900">
                  {t('settings.business')}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {t('settings.businessHelp')}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>

          <Link
            href={`/${locale}/subscriptions` as Route}
            className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:bg-slate-100/60"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
                <CreditCard className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-900">
                  {t('settings.subscriptionsLink')}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {t('settings.subscriptionsLinkHelp')}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>

          <Link
            href={`/${locale}/settings/whatsapp` as Route}
            className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:bg-slate-100/60"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-slate-900">
                    {locale === 'en' ? 'My WhatsApp number' : 'Mon numéro WhatsApp'}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                    PRO
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {locale === 'en'
                    ? 'Connect your personal number to send invoices'
                    : 'Connectez votre propre compte WhatsApp pour envoyer vos factures'}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>

          <Link
            href={`/${locale}/devices` as Route}
            className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:bg-slate-100/60"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80">
                <Smartphone className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-900">
                  {t('devices.title')}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  Sessions actives et autorisations d&apos;appareils
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>

          <Link
            href={`/${locale}/referrals` as Route}
            className="flex items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-slate-50/80 transition active:bg-slate-100/60"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70">
                <Gift className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-900">
                  {t('referrals.title')}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  Gagnez des jours Pro en partageant votre lien
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Section 2 : Préférences d'affichage et métier unifiées */}
      <div className="space-y-2">
        <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {locale === 'en' ? 'Preferences' : 'Préférences'}
        </h2>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          {/* Langue */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80">
                <Languages className="h-5 w-5" />
              </span>
              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  {t('settings.language')}
                </label>
                <p className="text-xs text-slate-500">
                  Choisissez la langue d&apos;affichage de MyCashBill.
                </p>
              </div>
            </div>
            <div className="sm:shrink-0">
              <LocaleSwitcher fullOnMobile />
            </div>
          </div>

          {/* Mode d'activité */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                {user?.mode === 'PRESTATION' ? (
                  <Briefcase className="h-5 w-5" />
                ) : (
                  <ShoppingBag className="h-5 w-5" />
                )}
              </span>
              <div>
                <label className="block text-sm font-semibold text-slate-900">
                  {t('settings.mode')}
                </label>
                <p className="text-xs text-slate-500">
                  Adapte la terminologie et les modèles de facturation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/80 p-1">
              <button
                type="button"
                disabled={savingMode}
                onClick={() => handleModeChange('ECOMMERCE')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition ${
                  user?.mode === 'ECOMMERCE'
                    ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t('auth.register.modeEcommerce')}</span>
              </button>
              <button
                type="button"
                disabled={savingMode}
                onClick={() => handleModeChange('PRESTATION')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition ${
                  user?.mode === 'PRESTATION'
                    ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t('auth.register.modePrestation')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Démarcation losange émeraude avant l'encadré vitrine */}
      <div className="pt-2 pb-1" aria-hidden="true">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/80 to-emerald-500/30" />
          <span className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-emerald-500/60 ring-4 ring-emerald-500/10" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-300/80 to-emerald-500/30" />
        </div>
      </div>

      {/* Encadré Site vitrine MyCashBill */}
      <Link
        href={`/${locale}?landing=1` as Route}
        className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50/30 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Globe className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {locale === 'en' ? 'MyCashBill Showcase Website' : 'Site vitrine MyCashBill'}
            </div>
            <div className="text-[11px] text-slate-500">
              {locale === 'en'
                ? 'Open the public presentation page (Landing Page)'
                : 'Ouvrir la page de présentation publique'}
            </div>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-emerald-600">
          {locale === 'en' ? 'Open ↗' : 'Ouvrir ↗'}
        </span>
      </Link>

      {/* Déconnexion & Suppression de compte */}
      <div className="pt-1 space-y-4">
        <Button
          type="button"
          variant="outline"
          disabled={loggingOut}
          loading={loggingOut}
          onClick={handleLogout}
          className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 thumb-zone"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('nav.logout')}</span>
        </Button>

        <DeleteAccountSection />
      </div>
    </div>
  );
}
