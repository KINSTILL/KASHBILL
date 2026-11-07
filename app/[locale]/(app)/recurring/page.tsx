import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { RecurringList, type ScheduleItem } from '@/components/recurring/RecurringList';

export default async function RecurringPage({
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

  const schedules = await prisma.recurringSchedule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      _count: { select: { runs: true } },
    },
  });

  const serialized: ScheduleItem[] = schedules.map((s) => ({
    id: s.id,
    label: s.label,
    docType: s.docType,
    frequency: s.frequency,
    nextRunAt: s.nextRunAt.toISOString(),
    lastRunAt: s.lastRunAt ? s.lastRunAt.toISOString() : null,
    isPaused: s.isPaused,
    autoSendEmail: s.autoSendEmail,
    client: s.client,
    _count: s._count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t('recurring.title')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">{t('recurring.subtitle')}</p>
      </div>

      <RecurringList initialSchedules={serialized} />
    </div>
  );
}

