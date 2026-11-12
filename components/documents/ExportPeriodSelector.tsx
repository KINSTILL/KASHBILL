'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExportZipButton } from './ExportZipButton';

type Preset = 'today' | 'week' | 'month' | 'year' | 'custom';

function computeRange(preset: Preset, customFrom: string, customTo: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === 'today') return { from: today.toISOString(), to: now.toISOString() };
  if (preset === 'week') {
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString(), to: now.toISOString() };
  }
  if (preset === 'month') {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return { from: d.toISOString(), to: now.toISOString() };
  }
  if (preset === 'year') {
    const d = new Date(today);
    d.setDate(d.getDate() - 364);
    return { from: d.toISOString(), to: now.toISOString() };
  }
  return { from: customFrom, to: customTo };
}

export function ExportPeriodSelector() {
  const t = useTranslations('documents.export');
  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { from, to } = computeRange(preset, customFrom, customTo);

  return (
    <div className="surface space-y-3 p-4">
      <p className="text-sm font-medium text-ink">{t('title')}</p>
      <div className="flex flex-wrap gap-2">
        {(['today', 'week', 'month', 'year', 'custom'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            aria-pressed={preset === p}
            className={`chat-pill ${preset === p ? 'chat-pill-active' : ''}`}
          >
            {t(p)}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="thumb-zone rounded-btn border border-slate-200 px-3 text-sm"
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="thumb-zone rounded-btn border border-slate-200 px-3 text-sm"
          />
        </div>
      )}
      <ExportZipButton from={from} to={to} />
    </div>
  );
}

