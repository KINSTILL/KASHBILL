'use client';

import { useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatFCFA } from '@/lib/utils';
import { haptic } from '@/lib/device/haptics';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { getPreferredFormat, savePreferredFormat } from '@/lib/pdf/format-preference';
import type { DocType } from '@prisma/client';
import type { PdfFormat } from '@/lib/pdf/types';

type Line = { description: string; quantity: number; unitPrice: number };
type DraftState = {
  type: DocType;
  clientId: string | null;
  lines: Line[];
  vatRate: number | null;
  depositPercentage: number | null;
  deliveryFee: number | null;
  notes: string | null;
  format: PdfFormat;
};

const DOC_TYPES: DocType[] = [
  'TICKET',
  'RECU',
  'DEVIS',
  'PROFORMA',
  'FACTURE',
  'BON_COMMANDE',
  'BORDEREAU',
];

export function DocumentForm({
  clients,
  initialDraftId,
}: {
  clients: { id: string; name: string }[];
  initialDraftId?: string;
}) {
  const t = useTranslations('documents.new');
  const locale = useLocale();
  const router = useRouter();

  const [state, setState] = useState<DraftState>({
    type: 'DEVIS',
    clientId: null,
    lines: [{ description: '', quantity: 1, unitPrice: 0 }],
    vatRate: null,
    depositPercentage: null,
    deliveryFee: null,
    notes: null,
    format: getPreferredFormat('DEVIS'),
  });

  const [submitting, setSubmitting] = useState(false);
  const draftId = useMemo(() => initialDraftId ?? `draft-${Date.now()}`, [initialDraftId]);
  const { status, lastSavedAt } = useAutoSave(draftId, state.type, state);

  const subtotal = state.lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0);
  const vatAmount = state.vatRate !== null ? Math.round((subtotal * state.vatRate) / 100) : 0;
  const depositAmount =
    state.depositPercentage !== null
      ? Math.round(((subtotal + vatAmount) * state.depositPercentage) / 100)
      : 0;
  const total = subtotal + vatAmount + (state.deliveryFee ?? 0) - depositAmount;

  const addLine = () =>
    setState((s) => ({ ...s, lines: [...s.lines, { description: '', quantity: 1, unitPrice: 0 }] }));

  const removeLine = (i: number) =>
    setState((s) => ({ ...s, lines: s.lines.filter((_, idx) => idx !== i) }));

  const updateLine = (i: number, field: keyof Line, value: string | number) =>
    setState((s) => {
      const lines = [...s.lines];
      lines[i] = { ...lines[i], [field]: value } as Line;
      return { ...s, lines };
    });

  const handleSubmit = async () => {
    setSubmitting(true);
    haptic('medium');
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          clientId: state.clientId,
          type: state.type,
          locale: locale.toUpperCase(),
          payload: {
            lines: state.lines.filter((l) => l.description && l.unitPrice > 0),
            vatRate: state.vatRate,
            depositPercentage: state.depositPercentage,
            deliveryFee: state.deliveryFee,
            notes: state.notes,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error?.message ?? 'Erreur');
        return;
      }

      const { documentId } = await res.json();
      savePreferredFormat(state.format);
      router.push(`/${locale}/documents/${documentId}?format=${state.format}` as Route);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <label className="mb-1 block text-sm font-medium">{t('type')}</label>
        <select
          value={state.type}
          onChange={(e) => {
            const type = e.target.value as DocType;
            setState((s) => ({ ...s, type, format: getPreferredFormat(type) }));
          }}
          className="thumb-zone w-full rounded-lg border bg-slate-50 p-2"
        >
          {DOC_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <label className="mb-1 block text-sm font-medium">{t('client')}</label>
        <select
          value={state.clientId ?? ''}
          onChange={(e) => setState((s) => ({ ...s, clientId: e.target.value || null }))}
          className="thumb-zone w-full rounded-lg border bg-slate-50 p-2"
        >
          <option value="">{t('noClient')}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-bold uppercase text-slate-500">{t('lines')}</h3>
        {state.lines.map((line, i) => (
          <div key={i} className="mb-3 space-y-2 border-b pb-3 last:border-0">
            <Input
              placeholder={t('description')}
              value={line.description}
              onChange={(e) => updateLine(i, 'description', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                inputMode="numeric"
                placeholder={t('quantity')}
                value={line.quantity}
                onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))}
              />
              <Input
                inputMode="numeric"
                placeholder={t('unitPrice')}
                value={line.unitPrice || ''}
                onChange={(e) => updateLine(i, 'unitPrice', Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>
                {t('lineTotal')} : <strong>{formatFCFA(line.quantity * line.unitPrice)}</strong>
              </span>
              {state.lines.length > 1 && (
                <button type="button" onClick={() => removeLine(i)} className="text-xs text-error">
                  {t('removeLine')}
                </button>
              )}
            </div>
          </div>
        ))}
        <Button type="button" variant="ghost" fullWidth onClick={addLine}>
          + {t('addLine')}
        </Button>
      </Card>

      <Card>
        <div className="grid grid-cols-2 gap-2">
          <Input
            inputMode="numeric"
            label={t('vat')}
            value={state.vatRate ?? ''}
            onChange={(e) =>
              setState((s) => ({ ...s, vatRate: e.target.value ? Number(e.target.value) : null }))
            }
          />
          <Input
            inputMode="numeric"
            label={t('deposit')}
            value={state.depositPercentage ?? ''}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                depositPercentage: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </div>
        <Input
          inputMode="numeric"
          label={t('delivery')}
          value={state.deliveryFee ?? ''}
          onChange={(e) =>
            setState((s) => ({ ...s, deliveryFee: e.target.value ? Number(e.target.value) : null }))
          }
          className="mt-2"
        />
        <Input
          label={t('notes')}
          value={state.notes ?? ''}
          onChange={(e) => setState((s) => ({ ...s, notes: e.target.value || null }))}
          className="mt-2"
        />
      </Card>

      <Card>
        <p className="text-sm">{t('format')} :</p>
        <div className="mt-2 inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
          {(['ticket', 'a4'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setState((s) => ({ ...s, format: f }))}
              className={`px-3 py-1 rounded ${state.format === f ? 'bg-sage-500 text-white' : ''}`}
            >
              {f === 'ticket' ? t('formatTicket') : t('formatA4')}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex justify-between text-lg font-bold">
          <span>{t('total')} :</span>
          <span className="text-terracotta">{formatFCFA(total)}</span>
        </div>
      </Card>

      {status === 'saved' && lastSavedAt && (
        <p className="text-center text-xs text-slate-400">
          {t('draftSaved', { time: new Date(lastSavedAt).toLocaleTimeString() })}
        </p>
      )}

      <Button fullWidth size="lg" onClick={handleSubmit} isLoading={submitting}>
        {t('generate')}
      </Button>
    </div>
  );
}

