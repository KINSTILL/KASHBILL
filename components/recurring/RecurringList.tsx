'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/device/haptics';
import type { Route } from 'next';

export type ScheduleItem = {
  id: string;
  label: string;
  docType: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  nextRunAt: string | Date;
  lastRunAt: string | Date | null;
  isPaused: boolean;
  autoSendEmail: boolean;
  client: { name: string } | null;
  _count: { runs: number };
};

export function RecurringList({
  initialSchedules,
}: {
  initialSchedules: ScheduleItem[];
}) {
  const t = useTranslations('recurring');
  const locale = useLocale();
  const toast = useToast();
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [busyId, setBusyId] = useState<string | null>(null);

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return t('never');
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CM' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const handleTogglePause = async (schedule: ScheduleItem) => {
    setBusyId(schedule.id);
    haptic('medium');
    const newPaused = !schedule.isPaused;

    try {
      const res = await fetch(`/api/recurring/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ isPaused: newPaused }),
      });

      if (!res.ok) {
        throw new Error('Failed to update');
      }

      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? { ...s, isPaused: newPaused } : s))
      );
      toast.show(t('updated'), 'success');
    } catch {
      toast.show(t('error'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (schedule: ScheduleItem) => {
    if (!window.confirm(t('deleteConfirm'))) return;

    setBusyId(schedule.id);
    haptic('heavy');

    try {
      const res = await fetch(`/api/recurring/${schedule.id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'fetch' },
      });

      if (!res.ok) {
        throw new Error('Failed to delete');
      }

      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
      toast.show(t('deleted'), 'success');
    } catch {
      toast.show(t('error'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const getFreqLabel = (freq: ScheduleItem['frequency']) => {
    switch (freq) {
      case 'DAILY':
        return t('daily');
      case 'WEEKLY':
        return t('weekly');
      case 'MONTHLY':
        return t('monthly');
      default:
        return freq;
    }
  };

  if (schedules.length === 0) {
    return (
      <EmptyState
        title={t('empty')}
        description={t('emptyHelp')}
        action={
          <Link href={`/${locale}/documents` as Route}>
            <Button variant="primary">{t('title')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map((s) => {
        const isBusy = busyId === s.id;
        return (
          <div
            key={s.id}
            className="surface space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-bold text-ink">{s.label}</h3>
                  <Badge variant={s.isPaused ? 'warning' : 'success'} size="sm">
                    {s.isPaused ? t('paused') : t('active')}
                  </Badge>
                  {s.autoSendEmail && (
                    <Badge variant="info" size="sm">
                      ✉️ {t('emailAutoBadge')}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {s.docType} {s.client ? `• Client: ${s.client.name}` : ''} •{' '}
                  <span className="font-medium text-slate-700">{getFreqLabel(s.frequency)}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {t('lastRun')}
                </p>
                <p className="mt-0.5 font-semibold text-slate-700">{formatDate(s.lastRunAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {t('nextRun')}
                </p>
                <p className="mt-0.5 font-semibold text-slate-700">{formatDate(s.nextRunAt)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <span className="text-slate-500">
                {t('runsCount', { count: s._count.runs })}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTogglePause(s)}
                  disabled={isBusy}
                >
                  {s.isPaused ? t('resume') : t('pause')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(s)}
                  disabled={isBusy}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

