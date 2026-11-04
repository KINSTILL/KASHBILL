import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReferralsShareBox } from './ReferralsShareBox';

export default async function ReferralsPage({
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
  const t = await getTranslations('referrals');

  const referrals = await prisma.referral.findMany({
    where: { parrainId: user.id },
    include: { filleul: true },
    orderBy: { createdAt: 'desc' },
  });

  const totalCount = referrals.length;
  const activatedCount = referrals.filter(
    (r) => r.status === 'ACTIVATED' || r.status === 'REWARDED'
  ).length;
  const proDaysEarned = activatedCount * 7;

  const appUrl = env.APP_URL || 'http://localhost:3000';
  const referralLink = `${appUrl}/${locale}/register?ref=${user.referralCode}`;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('title')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      <ReferralsShareBox code={user.referralCode} link={referralLink} />

      {/* Stats counter grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">{t('filleulsTotal')}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-sage-600">{activatedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">{t('filleulsActivated')}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">+{proDaysEarned}j</div>
          <div className="text-[11px] text-slate-500 mt-1">{t('proDaysEarned')}</div>
        </Card>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">{t('history')}</h2>

        {referrals.length === 0 ? (
          <EmptyState
            title={t('empty')}
            description={t('emptyHelp')}
          />
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {referrals.map((ref) => {
              const phone = ref.filleul.phone;
              const maskedPhone =
                phone.length >= 8
                  ? `${phone.slice(0, 4)}••••${phone.slice(-2)}`
                  : phone;

              const isActivated =
                ref.status === 'ACTIVATED' || ref.status === 'REWARDED';

              return (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-4 text-sm"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-900">
                      {ref.filleul.name || ref.filleul.businessName || maskedPhone}
                    </div>
                    <div className="text-xs text-slate-400">
                      Inscrit le {new Date(ref.createdAt).toLocaleDateString(locale)}
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge variant={isActivated ? 'success' : 'neutral'} size="sm">
                      {isActivated ? '+7 jours' : 'En attente 1er envoi'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

