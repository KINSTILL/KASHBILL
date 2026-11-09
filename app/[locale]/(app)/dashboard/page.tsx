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
import { UnsupportedCountryBanner } from '@/components/layout/UnsupportedCountryBanner';
import { HeroCard } from '@/components/ui/HeroCard';
import { StatCard } from '@/components/ui/StatCard';
import { formatDate, formatFCFA } from '@/lib/utils';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500">Vue d&apos;ensemble de votre activité</p>
        </div>
        <Link href={`/${locale}/documents/new` as Route}>
          <Button size="md" variant="primary">+ Nouveau document</Button>
        </Link>
      </div>
      <UnsupportedCountryBanner />
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
            {displayName}
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
            <Button size="lg" variant="secondary" fullWidth>
              + {t('nav.new')}
            </Button>
          </Link>
        }
      />

      {!userIsPro && <UpgradeCTA reason="removeWatermark" />}

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
          accent="brass"
        />
        <Link
          href={`/${locale}/recurring` as Route}
          className="col-span-2 block transition sm:col-span-1 hover:opacity-90"
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

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            {t('dashboard.recentDocuments')}
          </h2>
          {recentDocs.length > 0 && (
            <Link
              href={`/${locale}/documents` as Route}
              className="text-[12px] font-semibold text-sage-600 hover:text-sage-700"
            >
              {t('dashboard.seeAll')}
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
          <div className="rounded-xl border border-slate-100 bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Type</th>
                  <th>Client</th>
                  <th className="text-right">Total</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.slice(0, 5).map((doc) => {
                  const total = (doc.payload as { total?: number } | null)?.total ?? 0;
                  return (
                    <tr key={doc.id}>
                      <td className="font-mono text-xs text-slate-500">
                        <Link
                          href={`/${locale}/documents/${doc.id}` as Route}
                          className="hover:text-sage-700"
                        >
                          {doc.number}
                        </Link>
                      </td>
                      <td>{DOC_TYPE_CONFIG[doc.type]?.label}</td>
                      <td className="text-slate-600">{doc.client?.name ?? '—'}</td>
                      <td className="text-right font-medium">{formatFCFA(total)}</td>
                      <td>
                        <span
                          className={`status-badge ${doc.sentViaWhatsAppAt ? 'status-success' : 'status-neutral'}`}
                        >
                          {doc.sentViaWhatsAppAt ? 'Envoyé' : 'Brouillon'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
