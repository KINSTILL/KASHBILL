'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatFCFA } from '@/lib/utils';
import { haptic } from '@/lib/device/haptics';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { getDraft, deleteDraft } from '@/lib/storage/drafts';
import { useToast } from '@/components/ui/Toast';
import { savePreferredFormat } from '@/lib/pdf/format-preference';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { checkRequiredCompanyFields } from '@/lib/validators/documents';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { RequiredFieldsAlert } from './RequiredFieldsAlert';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
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
  validityDays: number | null;
  format: PdfFormat;
};

export function DocumentForm({
  clients,
  initialDraftId,
}: {
  clients: { id: string; name: string }[];
  initialDraftId?: string;
}) {
  const t = useTranslations('documents.new');
  const locale = useLocale();
  const isEn = locale === 'en';
  const router = useRouter();
  const { user } = useCurrentUser();

  const [state, setState] = useState<DraftState>({
    type: 'DEVIS',
    clientId: null,
    lines: [{ description: '', quantity: 1, unitPrice: 0 }],
    vatRate: null,
    depositPercentage: null,
    deliveryFee: null,
    notes: null,
    validityDays: 30,
    format: 'a4',
  });

  const currentConfig = DOC_TYPE_CONFIG[state.type];
  const [showPrices, setShowPrices] = useState<boolean>(currentConfig.showPricesByDefault);
  const [showReceiptQty, setShowReceiptQty] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const [existingDraft, setExistingDraft] = useState<DraftState | null>(null);
  const draftId = useMemo(() => initialDraftId ?? 'default-document-draft', [initialDraftId]);
  const { status, lastSavedAt } = useAutoSave(draftId, state.type, state);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    getDraft(draftId)
      .then((d) => {
        if (d && d.payload) {
          const payload = d.payload as DraftState;
          const hasContent =
            payload.lines?.some((l) => (l.description && l.description.trim() !== '') || l.unitPrice > 0) ||
            Boolean(payload.notes);
          if (hasContent) {
            setExistingDraft(payload);
          }
        }
      })
      .catch(() => {});
  }, [draftId]);

  const missingCompanyFields = useMemo(() => {
    if (!user) return [];
    return checkRequiredCompanyFields(state.type, {
      taxId: user.taxId ?? null,
      rccm: user.rccm ?? null,
      legalName: user.legalName ?? null,
      legalAddress: user.legalAddress ?? null,
    });
  }, [user, state.type]);

  const subtotal = state.lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0);
  const totalQuantity = state.lines.reduce((a, l) => a + (Number(l.quantity) || 0), 0);
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

  const applyQuickPreset = (presetText: string) => {
    haptic('light');
    setState((s) => {
      const emptyIdx = s.lines.findIndex((l) => !l.description || l.description.trim() === '');
      if (emptyIdx !== -1) {
        const lines = [...s.lines];
        lines[emptyIdx] = { ...lines[emptyIdx]!, description: presetText };
        return { ...s, lines };
      }
      return {
        ...s,
        lines: [...s.lines, { description: presetText, quantity: 1, unitPrice: 0 }],
      };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    haptic('medium');
    try {
      const validLines = state.lines
        .map((l) => ({
          description: l.description.trim(),
          quantity: Number(l.quantity) > 0 ? Number(l.quantity) : 1,
          unitPrice: currentConfig.priceOptional && !showPrices ? 0 : Number(l.unitPrice) || 0,
        }))
        .filter((l) =>
          currentConfig.priceOptional
            ? l.description.length > 0 && l.unitPrice >= 0
            : l.description.length > 0 && l.unitPrice > 0
        );

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          clientId: state.clientId,
          type: state.type,
          locale: locale.toUpperCase(),
          payload: {
            lines: validLines,
            vatRate: state.vatRate,
            depositPercentage: state.depositPercentage,
            deliveryFee: state.deliveryFee,
            notes: state.notes,
            validityDays: state.validityDays,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.show(err.error?.message ?? t('errorGeneric'), 'error');
        return;
      }

      await deleteDraft(draftId).catch(() => {});
      const { documentId } = await res.json();
      savePreferredFormat(state.format);
      router.push(`/${locale}/documents/${documentId}?format=${state.format}` as Route);
    } finally {
      setSubmitting(false);
    }
  };

  const presets = isEn ? currentConfig.quickPresets.en : currentConfig.quickPresets.fr;
  const isDeliveryNote = state.type === 'BORDEREAU';
  const isReceipt = state.type === 'RECU';
  const hideQtyInput = isReceipt && !showReceiptQty;
  const hidePriceInput = isDeliveryNote && !showPrices;

  return (
    <div className="space-y-4">
      {existingDraft && (
        <Card className="border border-sage-300 bg-sage-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{t('resumeDraft')}</p>
              <p className="text-xs text-slate-600">{t('resumeDraftHelp')}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  deleteDraft(draftId).catch(() => {});
                  setExistingDraft(null);
                }}
              >
                {t('discard')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const cfg = DOC_TYPE_CONFIG[existingDraft.type];
                  setShowPrices(cfg.showPricesByDefault);
                  setState(existingDraft);
                  setExistingDraft(null);
                }}
              >
                {t('resume')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <label className="mb-2 block text-sm font-medium">{t('type')}</label>
        <DocumentTypeSelector
          value={state.type}
          onChange={(type) => {
            const cfg = DOC_TYPE_CONFIG[type];
            setShowPrices(cfg.showPricesByDefault);
            setShowReceiptQty(false);
            setState((s) => ({
              ...s,
              type,
              format: cfg.defaultFormat,
              vatRate: cfg.showVat ? (s.vatRate ?? 19.25) : null,
              depositPercentage: cfg.showDeposit ? s.depositPercentage : null,
              deliveryFee: cfg.showDelivery ? s.deliveryFee : null,
              validityDays: cfg.showValidity ? (s.validityDays ?? cfg.defaultValidityDays) : null,
            }));
          }}
        />
      </Card>

      {missingCompanyFields.length > 0 && (
        <RequiredFieldsAlert
          missingFields={missingCompanyFields}
          docLabel={isEn ? currentConfig.labelEn : currentConfig.label}
        />
      )}

      <Card>
        <label htmlFor="clientId" className="mb-1 block text-sm font-medium">
          {t(`typeContext.${state.type}.clientLabel`)}
        </label>
        <select
          id="clientId"
          name="clientId"
          aria-label={t('client')}
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-700">
              {t(`typeContext.${state.type}.linesTitle`)}
            </h3>
            <p className="text-xs text-slate-500">
              {t(`typeContext.${state.type}.linesHint`)}
            </p>
          </div>

          {isDeliveryNote && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showPrices}
                onChange={(e) => setShowPrices(e.target.checked)}
                className="rounded border-slate-300 text-sage-600 focus:ring-sage-500"
              />
              {t('showPricesOnDelivery')}
            </label>
          )}

          {isReceipt && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showReceiptQty}
                onChange={(e) => setShowReceiptQty(e.target.checked)}
                className="rounded border-slate-300 text-sage-600 focus:ring-sage-500"
              />
              {t('showQtyOnReceipt')}
            </label>
          )}
        </div>

        {/* Suggestions rapides adaptées au type de document */}
        <div className="mb-3">
          <p className="mb-1.5 text-[11px] font-medium text-slate-500">{t('quickSuggestions')}</p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyQuickPreset(preset)}
                className="rounded-full border border-sage-200 bg-sage-50/70 px-2.5 py-1 text-xs font-medium text-sage-800 transition-colors hover:border-sage-400 hover:bg-sage-100"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {state.lines.map((line, i) => (
          <div key={i} className="mb-3 space-y-2 border-b pb-3 last:border-0">
            <Input
              name={`description-${i}`}
              label={t(`typeContext.${state.type}.descLabel`)}
              placeholder={t(`typeContext.${state.type}.descPlaceholder`)}
              value={line.description}
              onChange={(e) => updateLine(i, 'description', e.target.value)}
            />
            <div className={hideQtyInput || hidePriceInput ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2'}>
              {!hideQtyInput && (
                <Input
                  name={`quantity-${i}`}
                  inputMode="numeric"
                  label={t(`typeContext.${state.type}.qtyLabel`)}
                  placeholder={t('quantity')}
                  value={line.quantity}
                  onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))}
                />
              )}
              {!hidePriceInput && (
                <Input
                  name={`unitPrice-${i}`}
                  inputMode="numeric"
                  label={t(`typeContext.${state.type}.priceLabel`)}
                  placeholder={t('unitPrice')}
                  value={line.unitPrice || ''}
                  onChange={(e) => updateLine(i, 'unitPrice', Number(e.target.value))}
                />
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              {!hidePriceInput ? (
                <span>
                  {t('lineTotal')} :{' '}
                  <strong className="money">{formatFCFA(line.quantity * line.unitPrice)}</strong>
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  {t(`typeContext.${state.type}.qtyLabel`)} : <strong>{line.quantity}</strong>
                </span>
              )}
              {state.lines.length > 1 && (
                <button type="button" onClick={() => removeLine(i)} className="text-xs text-error">
                  {t('removeLine')}
                </button>
              )}
            </div>
          </div>
        ))}
        <Button type="button" variant="ghost" fullWidth onClick={addLine}>
          + {t(`typeContext.${state.type}.addLine`)}
        </Button>
      </Card>

      <Card>
        <div className="space-y-2">
          {DOC_TYPE_CONFIG[state.type].showVat && (
            <Input
              inputMode="numeric"
              label={t('vat')}
              value={state.vatRate ?? ''}
              onChange={(e) => setState((s) => ({ ...s, vatRate: e.target.value ? Number(e.target.value) : null }))}
            />
          )}
          {DOC_TYPE_CONFIG[state.type].showValidity && (
            <Input
              inputMode="numeric"
              label={t('validityDays')}
              value={state.validityDays ?? ''}
              onChange={(e) => setState((s) => ({ ...s, validityDays: e.target.value ? Number(e.target.value) : null }))}
            />
          )}
          {DOC_TYPE_CONFIG[state.type].showDeposit && (
            <Input
              inputMode="numeric"
              label={t('deposit')}
              value={state.depositPercentage ?? ''}
              onChange={(e) => setState((s) => ({ ...s, depositPercentage: e.target.value ? Number(e.target.value) : null }))}
            />
          )}
          {DOC_TYPE_CONFIG[state.type].showDelivery && (
            <Input
              inputMode="numeric"
              label={t('delivery')}
              value={state.deliveryFee ?? ''}
              onChange={(e) => setState((s) => ({ ...s, deliveryFee: e.target.value ? Number(e.target.value) : null }))}
            />
          )}
          <Input
            label={t(`typeContext.${state.type}.notesLabel`)}
            placeholder={t(`typeContext.${state.type}.notesPlaceholder`)}
            value={state.notes ?? ''}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value || null }))}
          />
        </div>
      </Card>

      <Card>
        <p className="text-sm">{t('format')} :</p>
        <div className="mt-2 inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
          {(['ticket', 'a4'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setState((s) => ({ ...s, format: f }))}
              className={`px-3 py-1 rounded ${state.format === f ? 'bg-sage-700 text-white font-medium' : ''}`}
            >
              {f === 'ticket' ? t('formatTicket') : t('formatA4')}
            </button>
          ))}
        </div>
      </Card>

      <Card className="border-none bg-gradient-to-br from-sage-500 to-sage-600 text-white">
        {hidePriceInput ? (
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-white/80">
              {t('totalItemsDelivered')}
            </p>
            <p className="money-lg text-[26px] text-white">{totalQuantity}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-white/80">
              {isReceipt ? t('totalReceived') : t('total')}
            </p>
            <p className="money-lg text-[26px] text-white">{formatFCFA(total)}</p>
          </div>
        )}
      </Card>

      {status === 'saved' && lastSavedAt && (
        <p className="text-center text-xs text-slate-600">
          {t('draftSaved', { time: new Date(lastSavedAt).toLocaleTimeString() })}
        </p>
      )}

      <Button fullWidth size="lg" onClick={handleSubmit} isLoading={submitting}>
        {t('generate')}
      </Button>
    </div>
  );
}
