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
import { UnsupportedCountryBanner } from '@/components/layout/UnsupportedCountryBanner';
import { HeroCard } from '@/components/ui/HeroCard';
import { StatCard } from '@/components/ui/StatCard';
import { DocumentCard } from '@/components/documents/DocumentCard';

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

  const [recentDocs, documentsCount, clientsCount, activatedReferralsCount, recurringCount] = await Promise.all([
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
  ]);

  const userIsPro = isPro(user);
  const userInTrial = isInTrial(user);

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

  const heroSubtitle = userInTrial
    ? t('dashboard.trialBanner', { days: trialDaysLeft })
    : !userIsPro
      ? t('dashboard.upgradeBanner')
      : t('dashboard.referralCount', { count: activatedReferralsCount });

  return (
    <div className="space-y-4">
      <UnsupportedCountryBanner />
      {proDaysLeft !== null && <ProExpiryBanner daysLeft={proDaysLeft} />}
      <HeroCard
        eyebrow={t('dashboard.welcomeBack')}
        title={
          <span className="flex items-center gap-2">
            {displayName}
            {userIsPro && <ProBadge />}
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
          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                number={doc.number}
                type={doc.type}
                clientName={doc.client?.name ?? null}
                total={(doc.payload as { total?: number } | null)?.total ?? 0}
                createdAt={doc.createdAt}
                sentViaWhatsAppAt={doc.sentViaWhatsAppAt}
                watermarked={doc.watermarked}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
