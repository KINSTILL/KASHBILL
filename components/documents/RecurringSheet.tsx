'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/device/haptics';

export function RecurringSheet({
  open,
  onOpenChange,
  documentId,
  documentNumber,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  documentNumber: string;
}) {
  const t = useTranslations('recurring');
  const toast = useToast();

  const [label, setLabel] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [autoSendEmail, setAutoSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    haptic('medium');

    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          documentId,
          label: label.trim() || `${documentNumber}`,
          frequency,
          autoSendEmail,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message ?? t('error'));
        haptic('heavy');
        return;
      }

      toast.show(t('success'), 'success');
      onOpenChange(false);
      setLabel('');
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('sheetTitle')}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{t('sheetSubtitle')}</p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <Input
          label={t('label')}
          placeholder={t('labelPlaceholder')}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
            {t('frequency')}
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY')}
            className="thumb-zone w-full rounded-btn border border-slate-200 bg-white px-3.5 text-[15px] text-ink focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-100"
          >
            <option value="DAILY">{t('freqDaily')}</option>
            <option value="WEEKLY">{t('freqWeekly')}</option>
            <option value="MONTHLY">{t('freqMonthly')}</option>
          </select>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={autoSendEmail}
            onChange={(e) => setAutoSendEmail(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sage-600 focus:ring-sage-500"
          />
          <span className="text-xs leading-relaxed text-slate-700">{t('autoSendEmail')}</span>
        </label>

        <div className="pt-2">
          <Button fullWidth size="lg" onClick={handleSave} loading={loading}>
            {t('save')}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
