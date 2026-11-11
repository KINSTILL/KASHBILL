import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Repeat, ArrowLeft } from 'lucide-react';
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
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
            <Repeat className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 truncate">
              {t('recurring.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              {t('recurring.subtitle')}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/dashboard` as Route}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 shrink-0 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('common.back')}</span>
        </Link>
      </div>

      <RecurringList initialSchedules={serialized} />
    </div>
  );
}

