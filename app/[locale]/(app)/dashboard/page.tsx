import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { isPro, isInTrial } from '@/lib/auth/plan';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { UpgradeCTA } from '@/components/ui/UpgradeCTA';
import { ProBadge } from '@/components/ui/ProBadge';
import { formatCurrency } from '@/lib/pdf/shared/format';

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

  const [recentDocs, activatedReferralsCount] = await Promise.all([
    prisma.document.findMany({
      where: { userId: user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    }),
    prisma.referral.count({
      where: {
        parrainId: user.id,
        status: { in: ['ACTIVATED', 'REWARDED'] },
      },
    }),
  ]);

  const userIsPro = isPro(user);
  const userInTrial = isInTrial(user);

  let trialDaysLeft = 0;
  if (userInTrial && user.proUntil) {
    trialDaysLeft = Math.max(
      0,
      Math.ceil((user.proUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }

  const displayName = user.name || user.businessName || user.phone;

  return (
    <div className="space-y-6">
      {/* Salutation & Status header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t('dashboard.welcomeBack')}, {displayName}
            </h1>
            {userIsPro && <ProBadge />}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {t('dashboard.referralCount', { count: activatedReferralsCount })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${locale}/documents/new` as Route}>
            <Button variant="primary" className="thumb-zone">
              + {t('nav.new')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Trial banner */}
      {userInTrial && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-sm">
                {t('dashboard.trialBanner', { days: trialDaysLeft })}
              </p>
              <p className="text-xs text-amber-700">
                Profitez de toutes les fonctionnalités Pro sans filigrane.
              </p>
            </div>
          </div>
          <Link href={`/${locale}/upgrade` as Route}>
            <Button size="sm" variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
              {t('nav.upgrade')}
            </Button>
          </Link>
        </div>
      )}

      {/* Upgrade CTA if not Pro and not in trial */}
      {!userIsPro && (
        <UpgradeCTA reason="removeWatermark" />
      )}

      {/* Quick stats or action cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href={`/${locale}/documents/new` as Route} className="group">
          <Card className="p-4 transition group-hover:border-sage-300 group-hover:shadow-sm">
            <div className="text-2xl mb-1">📄</div>
            <div className="font-semibold text-sm text-slate-900">Nouveau devis</div>
            <div className="text-xs text-slate-500">Facture ou reçu</div>
          </Card>
        </Link>

        <Link href={`/${locale}/clients/new` as Route} className="group">
          <Card className="p-4 transition group-hover:border-sage-300 group-hover:shadow-sm">
            <div className="text-2xl mb-1">👤</div>
            <div className="font-semibold text-sm text-slate-900">Nouveau client</div>
            <div className="text-xs text-slate-500">Carnet d&apos;adresses</div>
          </Card>
        </Link>

        <Link href={`/${locale}/referrals` as Route} className="group">
          <Card className="p-4 transition group-hover:border-sage-300 group-hover:shadow-sm">
            <div className="text-2xl mb-1">🎁</div>
            <div className="font-semibold text-sm text-slate-900">Parrainage</div>
            <div className="text-xs text-slate-500">+7 jours offerts</div>
          </Card>
        </Link>

        <Link href={`/${locale}/settings/business` as Route} className="group">
          <Card className="p-4 transition group-hover:border-sage-300 group-hover:shadow-sm">
            <div className="text-2xl mb-1">⚙️</div>
            <div className="font-semibold text-sm text-slate-900">Entreprise</div>
            <div className="text-xs text-slate-500">Logo &amp; mentions</div>
          </Card>
        </Link>
      </div>

      {/* Recent documents section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {t('dashboard.recentDocuments')}
          </h2>
          {recentDocs.length > 0 && (
            <Link
              href={`/${locale}/documents` as Route}
              className="text-xs font-medium text-sage-600 hover:text-sage-700"
            >
              Voir tout ({recentDocs.length})
            </Link>
          )}
        </div>

        {recentDocs.length === 0 ? (
          <EmptyState
            title={t('dashboard.noDocuments')}
            description={t('dashboard.noDocumentsHelp')}
            action={
              <Link href={`/${locale}/documents/new` as Route}>
                <Button variant="primary">
                  {t('dashboard.createFirst')}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {recentDocs.map((doc) => {
              const payload = doc.payload as { total?: number } | null;
              const total = payload?.total ?? 0;
              const status = doc.sentViaWhatsAppAt ? 'SENT' : 'DRAFT';
              const statusVariant = status === 'SENT' ? 'info' : 'neutral';

              return (
                <Link
                  key={doc.id}
                  href={`/${locale}/documents/${doc.id}` as Route}
                  className="flex items-center justify-between p-4 transition hover:bg-slate-50"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {doc.number}
                      </span>
                      <Badge variant={statusVariant} size="sm">
                        {doc.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {doc.client?.name || 'Client sans nom'} &bull;{' '}
                      {new Date(doc.createdAt).toLocaleDateString(locale)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-slate-900">
                      {formatCurrency(total, 'FCFA')}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {status}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

