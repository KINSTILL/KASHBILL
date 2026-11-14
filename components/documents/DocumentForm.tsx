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
import { useWakeLock } from '@/lib/device/wakelock';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { getDraft, deleteDraft } from '@/lib/storage/drafts';
import { useToast } from '@/components/ui/Toast';
import { savePreferredFormat } from '@/lib/pdf/format-preference';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { checkRequiredCompanyFields } from '@/lib/validators/documents';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { RequiredFieldsAlert } from './RequiredFieldsAlert';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { getOperatorsForCountry, isSupportedPaymentCountry } from '@/lib/countries/mobile-money';
import { getCurrencyForCountry } from '@/lib/countries/currency';
import type { DocType } from '@prisma/client';
import type { PdfFormat } from '@/lib/pdf/types';
import { computeTotals, roundTo, type ComputedPayload } from '@/lib/documents/payload';
import type { UserSuggestions } from '@/lib/documents/suggestions';
import { ScanModal } from './scan/ScanModal';
import type { ScannedQuote } from '@/lib/validators/quote-scan';
import { Sparkles } from 'lucide-react';

type Line = { description: string; quantity: number; unitPrice: number };
type DraftState = {
  type: DocType;
  clientId: string | null;
  clientMode: 'existing' | 'new';
  newClient: { name: string; phone: string; email: string; address: string; taxId: string };
  lines: Line[];
  vatRate: number | null;
  depositPercentage: number | null;
  deliveryFee: number | null;
  notes: string | null;
  validityDays: number | null;
  format: PdfFormat;
  dueDate: string | null;
  referenceNumber: string | null;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHECK' | null;
  paymentReference: string | null;
  deliveryDate: string | null;
  deliveryAddress: string | null;
  documentLocale: 'FR' | 'EN';
  paymentOperator: string | null;
  paymentOperatorFreeText: string | null;
  equivalentCurrency: string | null;
  equivalentAmount: number | null;
  exchangeRate: number | null;
  exchangeRateNote: string | null;
};

/** Brouillon existant (document non envoyé) à modifier. */
export type EditableDocument = {
  id: string;
  type: DocType;
  locale: 'FR' | 'EN';
  clientId: string | null;
  payload: ComputedPayload;
};

function buildEditState(doc: EditableDocument): DraftState {
  const p = doc.payload;
  return {
    type: doc.type,
    clientId: doc.clientId,
    clientMode: 'existing',
    newClient: { name: '', phone: '', email: '', address: '', taxId: '' },
    lines: p.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })),
    vatRate: p.vatRate ?? null,
    depositPercentage: p.depositPercentage ?? null,
    deliveryFee: p.deliveryFee ?? null,
    notes: p.notes ?? null,
    validityDays: p.validityDays ?? null,
    format: 'a4',
    dueDate: p.dueDate ?? null,
    referenceNumber: p.referenceNumber ?? null,
    paymentMethod: p.paymentMethod ?? null,
    paymentReference: p.paymentReference ?? null,
    deliveryDate: p.deliveryDate ?? null,
    deliveryAddress: p.deliveryAddress ?? null,
    documentLocale: doc.locale,
    paymentOperator: p.paymentOperator ?? null,
    paymentOperatorFreeText: p.paymentOperatorFreeText ?? null,
    equivalentCurrency: p.equivalentCurrency ?? null,
    equivalentAmount: p.equivalentAmount ?? null,
    exchangeRate: p.exchangeRate ?? null,
    exchangeRateNote: p.exchangeRateNote ?? null,
  };
}

export function DocumentForm({
  clients,
  initialDraftId,
  editDocument,
  userCountry = 'CM',
  userCurrency: _userCurrency = 'XAF',
  suggestions = {},
}: {
  clients: { id: string; name: string; country?: string | null }[];
  initialDraftId?: string;
  editDocument?: EditableDocument;
  userCountry?: string;
  userCurrency?: string;
  /** Motifs et articles déjà utilisés par l'utilisateur, par type de document. */
  suggestions?: UserSuggestions;
}) {
  const t = useTranslations('documents.new');
  const locale = useLocale();
  const isEn = locale === 'en';
  const router = useRouter();
  const { user } = useCurrentUser();

  const [state, setState] = useState<DraftState>(editDocument ? buildEditState(editDocument) : {
    type: 'DEVIS',
    clientId: null,
    clientMode: 'existing',
    newClient: { name: '', phone: '', email: '', address: '', taxId: '' },
    lines: [{ description: '', quantity: 1, unitPrice: 0 }],
    vatRate: null,
    depositPercentage: null,
    deliveryFee: null,
    notes: null,
    validityDays: 30,
    format: 'a4',
    dueDate: null,
    referenceNumber: null,
    paymentMethod: null,
    paymentReference: null,
    deliveryDate: null,
    deliveryAddress: null,
    documentLocale: (locale.toUpperCase() as 'FR' | 'EN'),
    paymentOperator: null,
    paymentOperatorFreeText: null,
    equivalentCurrency: null,
    equivalentAmount: null,
    exchangeRate: null,
    exchangeRateNote: null,
  });

  const userCountrySupported = isSupportedPaymentCountry(userCountry);

  const selectedClient = state.clientId ? clients.find((c) => c.id === state.clientId) : null;
  const clientCountry = selectedClient?.country ?? userCountry;
  const clientCurrency = getCurrencyForCountry(clientCountry);
  const isForeignClient = clientCountry !== userCountry;
  const canOfferMobileMoney = userCountrySupported && isSupportedPaymentCountry(clientCountry);
  const operators = canOfferMobileMoney ? getOperatorsForCountry(clientCountry) : [];
  const useFreeText = !canOfferMobileMoney;

  const currentConfig = DOC_TYPE_CONFIG[state.type];
  const [showPrices, setShowPrices] = useState<boolean>(currentConfig.showPricesByDefault);
  const [showReceiptQty, setShowReceiptQty] = useState<boolean>(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  useWakeLock(!submitting);
  const toast = useToast();
  const [validationErrors, setValidationErrors] = useState<{
    lines?: Record<number, { description?: boolean; unitPrice?: boolean }>;
    newClientName?: boolean;
    validityDays?: boolean;
    general?: string | null;
  }>({});
  const [existingDraft, setExistingDraft] = useState<DraftState | null>(null);
  const draftId = useMemo(
    () => (editDocument ? `edit-${editDocument.id}` : initialDraftId ?? 'default-document-draft'),
    [editDocument, initialDraftId]
  );
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

  // Précision d'affichage choisie par l'utilisateur (0, 1 ou 2 décimales).
  const decimals: 0 | 1 | 2 =
    user?.decimalPlaces === 1 || user?.decimalPlaces === 2 ? user.decimalPlaces : 0;

  // Même arrondi par ligne et même formule que le serveur (lib/documents/payload.ts).
  const subtotal = state.lines.reduce(
    (a, l) => a + roundTo(l.quantity * l.unitPrice, decimals),
    0
  );
  const totalQuantity = state.lines.reduce((a, l) => a + (Number(l.quantity) || 0), 0);
  const totals = computeTotals({
    subtotal,
    deliveryFee: state.deliveryFee ?? null,
    vatRate: state.vatRate,
    depositPercentage: state.depositPercentage,
    decimals,
  });
  const total = totals.total;

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

  const handleApplyScan = (scannedData: ScannedQuote, selectedType: DocType) => {
    haptic('medium');
    const cfg = DOC_TYPE_CONFIG[selectedType];
    setShowPrices(cfg.showPricesByDefault);

    setState((prev) => {
      // Pré-remplissage des lignes
      const newLines: Line[] =
        scannedData.items.length > 0
          ? scannedData.items.map((item) => ({
              description: item.description || '',
              quantity: item.quantity !== null && item.quantity > 0 ? item.quantity : 1,
              unitPrice: item.unitPrice !== null && item.unitPrice >= 0 ? item.unitPrice : 0,
            }))
          : prev.lines;

      // Gestion du client si détecté
      let newClientId = prev.clientId;
      let newClientMode = prev.clientMode;
      let newClientObj = { ...prev.newClient };

      if (scannedData.client && scannedData.client.trim()) {
        const matchingClient = clients.find(
          (c) => c.name.toLowerCase().includes(scannedData.client!.toLowerCase().trim())
        );
        if (matchingClient) {
          newClientId = matchingClient.id;
          newClientMode = 'existing';
        } else {
          newClientId = null;
          newClientMode = 'new';
          newClientObj.name = scannedData.client.trim();
        }
      }

      return {
        ...prev,
        type: selectedType,
        clientId: newClientId,
        clientMode: newClientMode,
        newClient: newClientObj,
        lines: newLines,
      };
    });

    toast.show(
      isEn
        ? 'Data imported from scan. Please review and adjust if needed.'
        : 'Données importées depuis le scan. Vous pouvez relire et ajuster si nécessaire.',
      'success'
    );
  };

  const handleSubmit = async () => {
    // 1. Validation dynamique et identification des cases manquantes
    const lineErrors: Record<number, { description?: boolean; unitPrice?: boolean }> = {};
    let hasLineError = false;

    state.lines.forEach((l, idx) => {
      const descEmpty = !l.description || l.description.trim() === '';
      const priceRequired = !currentConfig.priceOptional || showPrices;
      const priceEmpty = priceRequired && (isNaN(Number(l.unitPrice)) || Number(l.unitPrice) <= 0);

      if (descEmpty || priceEmpty) {
        lineErrors[idx] = {
          description: descEmpty,
          unitPrice: priceEmpty,
        };
        hasLineError = true;
      }
    });

    const newClientEmpty = state.clientMode === 'new' && (!state.newClient.name || state.newClient.name.trim() === '');
    const validityEmpty = currentConfig.showValidity && (state.validityDays === null || Number(state.validityDays) <= 0);

    if (hasLineError || newClientEmpty || validityEmpty || state.lines.length === 0) {
      setValidationErrors({
        lines: lineErrors,
        newClientName: newClientEmpty,
        validityDays: validityEmpty,
      });

      const missingList: string[] = [];
      if (hasLineError || state.lines.length === 0) {
        missingList.push(isEn ? 'articles/lines with valid price' : 'articles avec désignation et prix');
      }
      if (newClientEmpty) {
        missingList.push(isEn ? 'client name' : 'nom du client');
      }
      if (validityEmpty) {
        missingList.push(isEn ? 'validity period' : 'durée de validité');
      }

      const warningTitle = isEn
        ? `Incomplete data: please fill in ${missingList.join(', ')}.`
        : `Données incomplètes : veuillez renseigner ${missingList.join(', ')}.`;

      toast.show(warningTitle, 'error');

      // Scroll vers la première case manquante
      if (typeof document !== 'undefined') {
        const firstErrorEl = document.querySelector('[data-has-error="true"]');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setValidationErrors({});
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

      let finalClientId = state.clientId;

      if (state.clientMode === 'new' && state.newClient.name.trim()) {
        const clientRes = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
          body: JSON.stringify({
            name: state.newClient.name.trim(),
            phone: state.newClient.phone.trim() || null,
            email: state.newClient.email.trim() || null,
            address: state.newClient.address.trim() || null,
            taxId: state.newClient.taxId.trim() || null,
          }),
        });

        if (!clientRes.ok) {
          const err = await clientRes.json().catch(() => ({}));
          alert(err?.error?.code === 'PLAN_LIMIT_REACHED' ? t('clientLimitReached') : (err?.error?.message ?? t('clientCreateError')));
          setState((s) => ({ ...s, clientMode: 'existing' }));
          setSubmitting(false);
          return;
        }

        const { client } = await clientRes.json();
        finalClientId = client.id;
      }

      const res = await fetch(editDocument ? `/api/documents/${editDocument.id}` : '/api/documents', {
        method: editDocument ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({
          clientId: finalClientId,
          type: state.type,
          locale: state.documentLocale,
          payload: {
            lines: validLines,
            vatRate: state.vatRate ?? null,
            depositPercentage: state.depositPercentage ?? null,
            deliveryFee: state.deliveryFee ?? null,
            notes: state.notes ?? null,
            validityDays: state.validityDays ?? null,
            dueDate: state.dueDate ?? null,
            referenceNumber: state.referenceNumber ?? null,
            paymentMethod: state.paymentMethod ?? null,
            paymentReference: state.paymentReference,
            paymentOperator: state.paymentOperator,
            paymentOperatorFreeText: state.paymentOperatorFreeText,
            equivalentCurrency: isForeignClient ? clientCurrency : null,
            equivalentAmount: state.equivalentAmount,
            exchangeRate: state.exchangeRate,
            exchangeRateNote: state.exchangeRateNote,
            deliveryDate: state.deliveryDate ?? null,
            deliveryAddress: state.deliveryAddress ?? null,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.show(err?.error?.message ?? t('errorGeneric'), 'error');
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

  const isDocEn = state.documentLocale === 'EN';
  const presets = isDocEn ? currentConfig.quickPresets.en : currentConfig.quickPresets.fr;

  // Suggestions personnalisées : l'historique de l'utilisateur pour ce type de document
  // passe avant les suggestions par défaut, sans doublon ni article déjà présent dans la facture.
  const typeHistory = suggestions[state.type];
  const linesInUse = new Set(
    state.lines.map((l) => l.description.trim().toLowerCase()).filter((d) => d.length > 0)
  );
  const historyArticles = (typeHistory?.articles ?? []).filter(
    (a) => !linesInUse.has(a.toLowerCase())
  );
  const articleChips = [
    ...historyArticles,
    ...presets.filter(
      (p) =>
        !historyArticles.some((h) => h.toLowerCase() === p.toLowerCase()) &&
        !linesInUse.has(p.toLowerCase())
    ),
  ].slice(0, 8);
  const paymentChips = (typeHistory?.paymentReferences ?? []).filter(
    (r) => r !== (state.paymentReference ?? '')
  );
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
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">{t('type')}</label>
          {!editDocument && (
            <button
              type="button"
              onClick={() => {
                haptic('light');
                setIsScanModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-sage-500/40 bg-sage-500/10 px-2.5 py-1 text-xs font-semibold text-sage-800 transition-colors hover:bg-sage-500/20 dark:text-sage-300"
            >
              <Sparkles className="h-3.5 w-3.5 text-sage-600 dark:text-sage-400" />
              <span>{isEn ? 'Scan document (AI)' : 'Scanner un document (IA)'}</span>
            </button>
          )}
        </div>
        {editDocument ? (
          // En édition le type est verrouillé : il fixe le préfixe de numérotation du document.
          <div className="flex items-center gap-3 rounded-card border border-sage-500 bg-sage-50 p-3 ring-1 ring-sage-500/40">
            <span className="text-xl">{DOC_TYPE_CONFIG[state.type].icon}</span>
            <div>
              <p className="text-sm font-semibold text-ink">
                {isEn ? DOC_TYPE_CONFIG[state.type].shortLabelEn : DOC_TYPE_CONFIG[state.type].shortLabel}
              </p>
              <p className="text-xs text-slate-500">{t('typeLockedDraft')}</p>
            </div>
          </div>
        ) : (
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
              dueDate: cfg.showDueDate ? s.dueDate : null,
              referenceNumber: cfg.showReferenceNumber ? s.referenceNumber : null,
              paymentMethod: cfg.showPaymentInfo ? s.paymentMethod : null,
              paymentReference: cfg.showPaymentInfo ? s.paymentReference : null,
              paymentOperator: cfg.showPaymentInfo ? s.paymentOperator : null,
              paymentOperatorFreeText: cfg.showPaymentInfo ? s.paymentOperatorFreeText : null,
              equivalentCurrency: cfg.showPaymentInfo ? s.equivalentCurrency : null,
              equivalentAmount: cfg.showPaymentInfo ? s.equivalentAmount : null,
              exchangeRate: cfg.showPaymentInfo ? s.exchangeRate : null,
              exchangeRateNote: cfg.showPaymentInfo ? s.exchangeRateNote : null,
              deliveryDate: cfg.showShipmentDetails ? s.deliveryDate : null,
              deliveryAddress: cfg.showShipmentDetails ? s.deliveryAddress : null,
            }));
          }}
        />
        )}
        <div className="mt-3">
          <label className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            {t('documentLocale')}
          </label>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
            {(['FR', 'EN'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setState((s) => ({ ...s, documentLocale: l }))}
                className={`min-h-11 px-3 py-1 rounded sm:min-h-0 ${state.documentLocale === l ? 'bg-sage-500 text-white' : ''}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {missingCompanyFields.length > 0 && (
        <RequiredFieldsAlert
          missingFields={missingCompanyFields}
          docLabel={isEn ? currentConfig.labelEn : currentConfig.label}
        />
      )}

      <Card>
        <label className="mb-2 block text-sm font-medium">{t('client')}</label>
        <div className="mb-3 inline-flex rounded-lg border border-slate-300 p-0.5 text-sm">
          {(['existing', 'new'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setState((s) => ({ ...s, clientMode: m }))}
              className={`min-h-11 px-3 py-1 rounded sm:min-h-0 ${state.clientMode === m ? 'bg-sage-500 text-white' : ''}`}
            >
              {m === 'existing' ? t('clientModeExisting') : t('clientModeNew')}
            </button>
          ))}
        </div>

        {state.clientMode === 'existing' ? (
          <select
            value={state.clientId ?? ''}
            onChange={(e) => setState((s) => ({ ...s, clientId: e.target.value || null }))}
            className="thumb-zone w-full rounded-lg border bg-white p-2"
          >
            <option value="">{t('noClient')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
            <div data-has-error={validationErrors.newClientName ? 'true' : undefined}>
              <Input
                placeholder={t('newClientName')}
                value={state.newClient.name}
                error={
                  validationErrors.newClientName
                    ? isEn
                      ? 'The client name is required'
                      : 'Le nom du client est requis'
                    : undefined
                }
                onChange={(e) => {
                  setState((s) => ({ ...s, newClient: { ...s.newClient, name: e.target.value } }));
                  if (validationErrors.newClientName) {
                    setValidationErrors((v) => ({ ...v, newClientName: false }));
                  }
                }}
              />
            </div>
            <Input
              type="tel"
              inputMode="tel"
              placeholder={t('newClientPhone')}
              value={state.newClient.phone}
              onChange={(e) =>
                setState((s) => ({ ...s, newClient: { ...s.newClient, phone: e.target.value } }))
              }
            />
            <Input
              type="email"
              inputMode="email"
              placeholder={t('newClientEmail')}
              value={state.newClient.email}
              onChange={(e) =>
                setState((s) => ({ ...s, newClient: { ...s.newClient, email: e.target.value } }))
              }
            />
            <Input
              placeholder={t('newClientAddress')}
              value={state.newClient.address}
              onChange={(e) =>
                setState((s) => ({ ...s, newClient: { ...s.newClient, address: e.target.value } }))
              }
            />
            <Input
              placeholder={t('newClientTaxId')}
              value={state.newClient.taxId}
              onChange={(e) =>
                setState((s) => ({ ...s, newClient: { ...s.newClient, taxId: e.target.value } }))
              }
            />
          </div>
        )}
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
            {articleChips.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyQuickPreset(preset)}
                className="min-h-11 rounded-full border border-sage-200 bg-sage-50/70 px-3 py-1 text-xs font-medium text-sage-800 transition-colors hover:border-sage-400 hover:bg-sage-100 sm:min-h-0 sm:px-2.5"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {state.lines.map((line, i) => {
          const lineErr = validationErrors.lines?.[i];
          return (
            <div
              key={i}
              data-has-error={lineErr?.description || lineErr?.unitPrice ? 'true' : undefined}
              className={`mb-3 space-y-2 border-b pb-3 last:border-0 rounded-xl p-2 transition-all ${
                lineErr?.description || lineErr?.unitPrice ? 'bg-red-50/70 border border-red-200' : ''
              }`}
            >
              <Input
                name={`description-${i}`}
                label={t(`typeContext.${state.type}.descLabel`)}
                placeholder={t(`typeContext.${state.type}.descPlaceholder`)}
                value={line.description}
                error={
                  lineErr?.description
                    ? isEn
                      ? 'Item description is required'
                      : 'La désignation de l’article est requise'
                    : undefined
                }
                onChange={(e) => {
                  updateLine(i, 'description', e.target.value);
                  if (lineErr?.description) {
                    setValidationErrors((v) => ({
                      ...v,
                      lines: { ...v.lines, [i]: { ...v.lines?.[i], description: false } },
                    }));
                  }
                }}
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
                    inputMode={decimals > 0 ? 'decimal' : 'numeric'}
                    step={decimals > 0 ? (decimals === 1 ? 0.1 : 0.01) : 1}
                    label={t(`typeContext.${state.type}.priceLabel`)}
                    placeholder={t('unitPrice')}
                    value={line.unitPrice || ''}
                    error={
                      lineErr?.unitPrice
                        ? isEn
                          ? 'A valid price is required'
                          : 'Un prix unitaire valide est requis'
                        : undefined
                    }
                    onChange={(e) => {
                      updateLine(i, 'unitPrice', Number(e.target.value));
                      if (lineErr?.unitPrice) {
                        setValidationErrors((v) => ({
                          ...v,
                          lines: { ...v.lines, [i]: { ...v.lines?.[i], unitPrice: false } },
                        }));
                      }
                    }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                {!hidePriceInput ? (
                  <span>
                    {t('lineTotal')} :{' '}
                    <strong className="money">{formatFCFA(line.quantity * line.unitPrice, decimals)}</strong>
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
          );
        })}
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
            <div data-has-error={validationErrors.validityDays ? 'true' : undefined}>
              <Input
                inputMode="numeric"
                label={t('validityDays')}
                value={state.validityDays ?? ''}
                error={
                  validationErrors.validityDays
                    ? isEn
                      ? 'Validity period (in days) is required'
                      : 'La durée de validité (en jours) est requise'
                    : undefined
                }
                onChange={(e) => {
                  setState((s) => ({ ...s, validityDays: e.target.value ? Number(e.target.value) : null }));
                  if (validationErrors.validityDays) {
                    setValidationErrors((v) => ({ ...v, validityDays: false }));
                  }
                }}
              />
            </div>
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
          {DOC_TYPE_CONFIG[state.type].showDueDate && (
            <Input
              type="date"
              label={t('dueDate')}
              value={state.dueDate?.slice(0, 10) ?? ''}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
            />
          )}
          {DOC_TYPE_CONFIG[state.type].showReferenceNumber && (
            <Input
              label={t('referenceNumber')}
              placeholder={t('referenceNumberPlaceholder')}
              value={state.referenceNumber ?? ''}
              onChange={(e) =>
                setState((s) => ({ ...s, referenceNumber: e.target.value || null }))
              }
            />
          )}
          {DOC_TYPE_CONFIG[state.type].showPaymentInfo && (
            <>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                  {t('paymentMethod')}
                </label>
                <select
                  value={state.paymentMethod ?? ''}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      paymentMethod: (e.target.value || null) as DraftState['paymentMethod'],
                    }))
                  }
                  className="thumb-zone w-full rounded-btn border border-slate-200 bg-white px-3.5 text-[15px]"
                >
                  <option value="">—</option>
                  <option value="CASH">{t('paymentCash')}</option>
                  <option value="MOBILE_MONEY">{t('paymentMobileMoney')}</option>
                  <option value="BANK_TRANSFER">{t('paymentBankTransfer')}</option>
                  <option value="CHECK">{t('paymentCheck')}</option>
                </select>
              </div>
              {!useFreeText ? (
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                    {t('paymentOperator')}
                  </label>
                  <select
                    value={state.paymentOperator ?? ''}
                    onChange={(e) => setState((s) => ({ ...s, paymentOperator: e.target.value || null }))}
                    className="thumb-zone w-full rounded-btn border border-slate-200 bg-white px-3.5 text-[15px]"
                  >
                    <option value="">—</option>
                    {operators.map((op) => (
                      <option key={op.code} value={op.code}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <Input
                    label={t('paymentOperatorFreeText')}
                    placeholder={t('paymentOperatorFreeTextPlaceholder')}
                    value={state.paymentOperatorFreeText ?? ''}
                    onChange={(e) =>
                      setState((s) => ({ ...s, paymentOperatorFreeText: e.target.value || null }))
                    }
                  />
                  {!userCountrySupported && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      ⚠️ {t('mobileMoneyNotAvailableInCountry')}
                    </p>
                  )}
                </>
              )}
              <Input
                label={t('paymentReference')}
                placeholder={t('paymentReferencePlaceholder')}
                value={state.paymentReference ?? ''}
                onChange={(e) =>
                  setState((s) => ({ ...s, paymentReference: e.target.value || null }))
                }
              />
              {/* Motifs déjà utilisés par l'utilisateur pour ce type de document. Rien s'il n'y en a pas. */}
              {paymentChips.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-slate-500">{t('recentReasons')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {paymentChips.slice(0, 6).map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          haptic('light');
                          setState((s) => ({ ...s, paymentReference: reason }));
                        }}
                        className="min-h-11 max-w-full truncate rounded-full border border-sage-200 bg-sage-50/70 px-3 py-1 text-xs font-medium text-sage-800 transition-colors hover:border-sage-400 hover:bg-sage-100 sm:min-h-0 sm:px-2.5"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {isForeignClient && (
            <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p className="text-[12px] font-medium text-orange-900">
                ⚠️ {t('foreignClientWarning', { country: clientCountry, currency: clientCurrency })}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  inputMode="numeric"
                  label={t('exchangeRate')}
                  placeholder="0.028"
                  value={state.exchangeRate ?? ''}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      exchangeRate: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
                <Input
                  inputMode="numeric"
                  label={t('equivalentAmount', { currency: clientCurrency })}
                  value={state.equivalentAmount ?? ''}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      equivalentAmount: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <Input
                label={t('exchangeRateNote')}
                placeholder={t('exchangeRateNotePlaceholder')}
                value={state.exchangeRateNote ?? ''}
                onChange={(e) =>
                  setState((s) => ({ ...s, exchangeRateNote: e.target.value || null }))
                }
              />
            </div>
          )}
          {DOC_TYPE_CONFIG[state.type].showShipmentDetails && (
            <>
              <Input
                type="date"
                label={t('deliveryDate')}
                value={state.deliveryDate?.slice(0, 10) ?? ''}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    deliveryDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }))
                }
              />
              <Input
                label={t('deliveryAddress')}
                placeholder={t('deliveryAddressPlaceholder')}
                value={state.deliveryAddress ?? ''}
                onChange={(e) =>
                  setState((s) => ({ ...s, deliveryAddress: e.target.value || null }))
                }
              />
            </>
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
        <p className="text-sm font-medium text-slate-700">{t('format')} :</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:inline-flex sm:rounded-lg sm:border sm:border-slate-300 sm:p-0.5">
          {(['ticket', 'a4'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setState((s) => ({ ...s, format: f }))}
              className={`min-h-11 rounded-lg px-4 py-2.5 text-center font-semibold transition sm:min-h-0 sm:px-3 sm:py-1.5 ${
                state.format === f
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 sm:border-0 sm:bg-transparent'
              }`}
            >
              {f === 'ticket' ? t('formatTicket') : t('formatA4')}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4 pb-6">
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
              <p className="money-lg text-[26px] text-white">{formatFCFA(total, decimals)}</p>
            </div>
          )}
        </Card>

        {status === 'saved' && lastSavedAt && (
          <p className="text-center text-xs text-slate-600">
            {t('draftSaved', { time: new Date(lastSavedAt).toLocaleTimeString() })}
          </p>
        )}

        <Button
          type="button"
          fullWidth
          size="lg"
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          isLoading={submitting}
        >
          {t('generate')}
        </Button>
      </div>

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        currency={clientCurrency}
        onApplyToForm={handleApplyScan}
      />
    </div>
  );
}
