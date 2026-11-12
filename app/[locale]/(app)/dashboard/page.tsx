import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { isPro, isInTrial } from '@/lib/auth/plan';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { UpgradeCTA } from '@/components/ui/UpgradeCTA';
import { ProBadge } from '@/components/ui/ProBadge';
import { ProExpiryBanner } from '@/components/ui/ProExpiryBanner';
import { ProGiftBanner } from '@/components/ui/ProGiftBanner';
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner';
import { getActiveAnnouncement } from '@/lib/announcements';
import { UnsupportedCountryBanner } from '@/components/layout/UnsupportedCountryBanner';
import { HeroCard } from '@/components/ui/HeroCard';
import { StatCard } from '@/components/ui/StatCard';
import { formatDate, formatFCFA } from '@/lib/utils';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { Plus, FileText, ChevronRight, CheckCircle2, Clock, Globe } from 'lucide-react';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const current = await getCurrentUser();

  if (!current) {
    redirect(`/${locale}/login` as Route);
  }

  const { user } = current;
  const t = await getTranslations();

  const [
    recentDocs,
    documentsCount,
    clientsCount,
    activatedReferralsCount,
    recurringCount,
    latestGiftSub,
    activeAnnouncement,
  ] = await Promise.all([
    prisma.document.findMany({
      where: { userId: user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    }),
    prisma.document.count({ where: { userId: user.id } }),
    prisma.client.count({ where: { userId: user.id } }),
    prisma.referral.count({
      where: {
        parrainId: user.id,
        status: { in: ['ACTIVATED', 'REWARDED'] },
      },
    }),
    prisma.recurringSchedule.count({
      where: { userId: user.id },
    }),
    prisma.subscription.findFirst({
      where: {
        userId: user.id,
        source: 'ADMIN_GIFT',
        endsAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getActiveAnnouncement(),
  ]);

  const userIsPro = isPro(user);
  const userInTrial = isInTrial(user);
  const isGiftedPro = Boolean(latestGiftSub && userIsPro);
  const formattedGiftDate = latestGiftSub
    ? formatDate(new Date(latestGiftSub.endsAt), locale as 'fr' | 'en')
    : '';

  let trialDaysLeft = 0;
  if (userInTrial && user.proUntil) {
    trialDaysLeft = Math.max(
      0,
      Math.ceil((new Date(user.proUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }

  let proDaysLeft: number | null = null;
  if (user.proUntil) {
    const diff = Math.ceil((new Date(user.proUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff <= 3) {
      proDaysLeft = diff;
    }
  }

  const displayName = user.businessName || user.name || user.phone;

  const heroSubtitle = isGiftedPro
    ? t('dashboard.proGiftedHero', { date: formattedGiftDate })
    : userInTrial
      ? t('dashboard.trialBanner', { days: trialDaysLeft })
      : !userIsPro
        ? t('dashboard.upgradeBanner')
        : t('dashboard.referralCount', { count: activatedReferralsCount });

  return (
    <div className="space-y-4">
      {/* En-tête mobile sans overflow */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
            Tableau de bord
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Vue d&apos;ensemble de votre activité</p>
        </div>
        <Link href={`/${locale}/documents/new` as Route} className="shrink-0">
          <Button size="md" className="gap-1.5 font-bold shadow-md shadow-emerald-900/10">
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Nouveau</span>
          </Button>
        </Link>
      </div>

      <UnsupportedCountryBanner />

      {activeAnnouncement && (
        <AnnouncementBanner announcement={activeAnnouncement} dismissible />
      )}

      {isGiftedPro && latestGiftSub && (
        <ProGiftBanner
          endsAtFormatted={formattedGiftDate}
          subId={latestGiftSub.id}
        />
      )}

      {!isGiftedPro && proDaysLeft !== null && <ProExpiryBanner daysLeft={proDaysLeft} />}

      <HeroCard
        eyebrow={t('dashboard.welcomeBack')}
        title={
          <span className="flex items-center gap-2">
            <span className="truncate">{displayName}</span>
            {userIsPro && (
              <ProBadge
                label={isGiftedPro ? t('dashboard.proGiftedBadge') : undefined}
              />
            )}
          </span>
        }
        subtitle={heroSubtitle}
        action={
          <Link href={`/${locale}/documents/new` as Route} className="block">
            <Button size="lg" variant="secondary" fullWidth className="font-semibold">
              + {t('nav.new')}
            </Button>
          </Link>
        }
      />

      {!userIsPro && <UpgradeCTA reason="removeWatermark" />}

      {/* Grille de stats 2 colonnes sur mobile, 3 sur desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label={t('dashboard.stats.documents')}
          value={documentsCount}
          hint={t('dashboard.stats.documentsHint')}
          icon="📄"
          accent="sage"
        />
        <StatCard
          label={t('dashboard.stats.clients')}
          value={clientsCount}
          hint={t('dashboard.stats.clientsHint')}
          icon="👥"
          accent="sage"
        />
        <Link
          href={`/${locale}/recurring` as Route}
          className="col-span-2 block transition sm:col-span-1 hover:opacity-95"
        >
          <StatCard
            label={t('dashboard.stats.recurring')}
            value={recurringCount}
            hint={t('dashboard.stats.recurringHint')}
            icon="⏱️"
            accent="ink"
          />
        </Link>
      </div>

      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
            {t('dashboard.recentDocuments')}
          </h2>
          {recentDocs.length > 0 && (
            <Link
              href={`/${locale}/documents` as Route}
              className="text-[12px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              {t('dashboard.seeAll')} &rarr;
            </Link>
          )}
        </div>

        {recentDocs.length === 0 ? (
          <EmptyState
            title={t('dashboard.noDocuments')}
            description={t('dashboard.noDocumentsHelp')}
            action={
              <Link href={`/${locale}/documents/new` as Route}>
                <Button variant="primary">{t('dashboard.createFirst')}</Button>
              </Link>
            }
          />
        ) : (
          <>
            {/* VUE MOBILE (Cartes tactiles sans scroll horizontal) */}
            <div className="space-y-2 sm:hidden">
              {recentDocs.slice(0, 5).map((doc) => {
                const total = (doc.payload as { total?: number } | null)?.total ?? 0;
                const typeCfg = DOC_TYPE_CONFIG[doc.type];
                const isSent = Boolean(doc.sentViaWhatsAppAt);

                return (
                  <Link
                    key={doc.id}
                    href={`/${locale}/documents/${doc.id}` as Route}
                    className="block rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs transition-all active:scale-[0.98] active:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <FileText className="h-4 w-4 stroke-[2.2]" />
                        </span>
                        <div className="min-w-0">
                          <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {typeCfg?.label || doc.type}
                          </span>
                          <p className="truncate text-xs font-mono font-semibold text-slate-500 mt-0.5">
                            {doc.number}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="money text-sm font-bold text-slate-950">
                          {formatFCFA(total)}
                        </span>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Envoyé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              <Clock className="h-2.5 w-2.5" />
                              Brouillon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-xs text-slate-500">
                      <p className="truncate font-medium text-slate-700">
                        Client : <span className="font-semibold text-slate-900">{doc.client?.name ?? '—'}</span>
                      </p>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                        {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* VUE TABLETTE & DESKTOP (Tableau classique anti-débordement) */}
            <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Numéro</th>
                      <th>Type</th>
                      <th>Client</th>
                      <th className="text-right">Total</th>
                      <th>Statut</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocs.slice(0, 5).map((doc) => {
                      const total = (doc.payload as { total?: number } | null)?.total ?? 0;
                      return (
                        <tr key={doc.id} className="group">
                          <td className="font-mono text-xs font-semibold text-slate-700">
                            <Link
                              href={`/${locale}/documents/${doc.id}` as Route}
                              className="hover:text-emerald-700"
                            >
                              {doc.number}
                            </Link>
                          </td>
                          <td>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {DOC_TYPE_CONFIG[doc.type]?.label}
                            </span>
                          </td>
                          <td className="font-medium text-slate-900">{doc.client?.name ?? '—'}</td>
                          <td className="text-right font-mono font-bold text-slate-900">
                            {formatFCFA(total)}
                          </td>
                          <td>
                            <span
                              className={`status-badge ${
                                doc.sentViaWhatsAppAt ? 'status-success' : 'status-neutral'
                              }`}
                            >
                              {doc.sentViaWhatsAppAt ? 'Envoyé' : 'Brouillon'}
                            </span>
                          </td>
                          <td className="text-right">
                            <Link
                              href={`/${locale}/documents/${doc.id}` as Route}
                              aria-label={`Voir le document ${doc.number}`}
                              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              Voir
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Démarcation épurée entre les documents récents et l'encadré vitrine */}
      <div className="pt-4 pb-1" aria-hidden="true">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/80 to-emerald-500/30" />
          <span className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-emerald-500/60 ring-4 ring-emerald-500/10" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-300/80 to-emerald-500/30" />
        </div>
      </div>

      {/* Accès rapide à la Landing Page en bas du tableau de bord */}
      <div>
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
      </div>
    </div>
  );
}
