'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { isPro } from '@/lib/auth/plan';
import { haptic } from '@/lib/device/haptics';
import type { Route } from 'next';

type ClientItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type BulkResultItem = {
  clientId: string;
  clientName: string;
  documentId?: string;
  number?: string;
  waUrl?: string;
  error?: string;
};

export function BulkSheet({
  open,
  onOpenChange,
  documentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  documentNumber?: string;
}) {
  const t = useTranslations('bulk');
  const locale = useLocale();
  const toast = useToast();
  const { user } = useCurrentUser();
  const pro = isPro(user ?? {});

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [channel, setChannel] = useState<'EMAIL' | 'WHATSAPP_LINKS'>('WHATSAPP_LINKS');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BulkResultItem[] | null>(null);

  useEffect(() => {
    if (!open) {
      setResults(null);
      setError(null);
      return;
    }

    let active = true;
    setLoadingClients(true);
    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch clients'))))
      .then((data) => {
        if (active && Array.isArray(data.clients)) {
          setClients(data.clients);
          setSelectedIds(data.clients.map((c: ClientItem) => c.id));
        }
      })
      .catch(() => {
        if (active) setError(t('noClients'));
      })
      .finally(() => {
        if (active) setLoadingClients(false);
      });

    return () => {
      active = false;
    };
  }, [open, t]);

  const handleToggleClient = (id: string) => {
    haptic('light');
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    haptic('light');
    setSelectedIds(clients.map((c) => c.id));
  };

  const handleDeselectAll = () => {
    haptic('light');
    setSelectedIds([]);
  };

  const handleSubmit = async () => {
    if (!documentId) return;
    if (selectedIds.length === 0) {
      setError(t('minOneClient'));
      return;
    }
    setSubmitting(true);
    setError(null);
    haptic('medium');

    try {
      const res = await fetch('/api/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          documentId,
          clientIds: selectedIds,
          channel,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message ?? t('error'));
        haptic('heavy');
        return;
      }

      setResults(body.results ?? []);
      toast.show(
        t('resultsSummary', { success: body.success ?? 0, fail: body.fail ?? 0 }),
        'success'
      );
    } catch {
      setError(t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('title')}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{t('sheetSubtitle')}</p>

        {!pro && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">{t('proOnly')}</p>
            <Link
              href={`/${locale}/upgrade` as Route}
              className="mt-2 inline-block font-bold text-amber-800 underline hover:text-amber-950"
            >
              {t('upgrade')} →
            </Link>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {results !== null ? (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">{t('results')}</h3>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {results.map((r) => (
                <div
                  key={r.clientId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{r.clientName}</p>
                    {r.number && <p className="text-slate-500">{r.number}</p>}
                    {r.error && <p className="text-red-500 font-medium">{r.error}</p>}
                  </div>
                  {r.waUrl && (
                    <a
                      href={r.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button size="sm" variant="whatsapp">
                        {t('openWhatsapp')}
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Button fullWidth variant="secondary" onClick={() => onOpenChange(false)}>
                {t('close')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                {t('channel')}
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as 'EMAIL' | 'WHATSAPP_LINKS')}
                className="thumb-zone w-full rounded-btn border border-slate-200 bg-white px-3.5 text-[15px] text-ink focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-100"
              >
                <option value="WHATSAPP_LINKS">{t('channelWhatsappLinks')}</option>
                <option value="EMAIL">{t('channelEmail')}</option>
              </select>
              {channel === 'WHATSAPP_LINKS' && (
                <p className="mt-1 text-xs text-slate-500">{t('channelWhatsappHelp')}</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-700">
                  {t('selectClients', { count: selectedIds.length })}
                </span>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="font-semibold text-sage-600 hover:text-sage-700"
                  >
                    {t('selectAll')}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="font-semibold text-slate-500 hover:text-slate-700"
                  >
                    {t('deselectAll')}
                  </button>
                </div>
              </div>

              {loadingClients ? (
                <div className="flex justify-center p-6">
                  <Spinner size="md" />
                </div>
              ) : clients.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                  {t('noClients')}
                </p>
              ) : (
                <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
                  {clients.map((c) => {
                    const checked = selectedIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 rounded-lg p-2 text-xs cursor-pointer transition ${
                          checked ? 'bg-sage-50 text-sage-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleClient(c.id)}
                          className="h-4 w-4 rounded border-slate-300 text-sage-600 focus:ring-sage-500"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{c.name}</p>
                          <p className="truncate text-[11px] text-slate-500">
                            {c.phone ?? t('noPhone')} • {c.email ?? t('noEmail')}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                fullWidth
                size="lg"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!pro || selectedIds.length === 0}
              >
                {t('sendButton')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
