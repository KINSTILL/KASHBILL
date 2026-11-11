'use client';

import type { PdfDocument, PdfFormat } from '@/lib/pdf/types';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatCurrency, formatDateShort } from '@/lib/pdf/shared/format';
import { resolveBrand } from '@/lib/pdf/brand';

const PAYMENT_LABELS: Record<string, { fr: string; en: string }> = {
  CASH: { fr: 'Espèces', en: 'Cash' },
  MOBILE_MONEY: { fr: 'Mobile Money', en: 'Mobile Money' },
  BANK_TRANSFER: { fr: 'Virement bancaire', en: 'Bank transfer' },
  CHECK: { fr: 'Chèque', en: 'Check' },
};

export function HtmlDocumentPreview({
  doc,
  format,
  showWatermark,
}: {
  doc: PdfDocument;
  format: PdfFormat;
  showWatermark: boolean;
}) {
  const config = DOC_TYPE_CONFIG[doc.type];
  const isEn = doc.locale === 'EN';
  const hidePrices = doc.type === 'BORDEREAU' && doc.payload.total === 0;
  const brand = resolveBrand(doc.company);
  const compact = format === 'ticket';
  const currency = doc.company.currency;

  const clientBlockLabel =
    doc.type === 'BORDEREAU'
      ? isEn
        ? 'Delivered to'
        : 'Livré à'
      : doc.type === 'RECU'
        ? isEn
          ? 'Received from'
          : 'Reçu de'
        : isEn
          ? 'Billed to'
          : 'Facturé à';

  const totalQty = doc.payload.lines.reduce((acc, l) => acc + l.quantity, 0);

  return (
    <div
      className={`relative mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm ${
        compact ? 'max-w-[340px] p-5 text-xs' : 'max-w-2xl p-6 sm:p-10 text-sm'
      }`}
    >
      {/* Bandeau filigrane gratuit */}
      {showWatermark && !doc.whiteLabel && (
        <>
          <div className="mb-3 -mx-6 -mt-6 bg-amber-500 px-3 py-1.5 text-center text-[11px] font-bold tracking-wider text-white sm:-mx-10 sm:-mt-10">
            MYCASHBILL — {isEn ? 'FREE VERSION' : 'VERSION GRATUITE'}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          >
            <span className="-rotate-30 text-4xl font-extrabold tracking-widest text-slate-400/25 sm:text-6xl">
              {isEn ? 'FREE' : 'GRATUIT'}
            </span>
          </div>
        </>
      )}

      {/* En-tête entreprise */}
      <div
        className={`flex items-start gap-3 ${
          compact ? 'border-b pb-3 mb-3' : 'mb-4'
        }`}
        style={compact ? { borderColor: brand.primary } : undefined}
      >
        {doc.company.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.company.logoUrl}
            alt="Logo"
            className={`${compact ? 'h-10 w-10' : 'h-14 w-14'} shrink-0 object-contain`}
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`${compact ? 'text-sm' : 'text-lg'} font-bold leading-tight`}
            style={{ color: brand.primary }}
          >
            {doc.company.businessName ??
              doc.company.legalName ??
              (isEn ? 'My Business' : 'Mon entreprise')}
          </p>
          {doc.company.legalForm && (
            <p className="text-xs italic text-slate-500">{doc.company.legalForm}</p>
          )}
          {doc.company.legalAddress && (
            <p className="text-xs text-slate-600">{doc.company.legalAddress}</p>
          )}
          {doc.company.city && <p className="text-xs text-slate-600">{doc.company.city}</p>}
          <p className="text-xs text-slate-600">
            {isEn ? 'Phone' : 'Tél'} : {doc.company.phone}
          </p>
          {doc.company.taxId && (
            <p className="text-xs text-slate-600">
              {isEn ? 'Tax ID (NIU)' : 'NIU'} : {doc.company.taxId}
            </p>
          )}
          {doc.company.rccm && (
            <p className="text-xs text-slate-600">RCCM : {doc.company.rccm}</p>
          )}
        </div>
      </div>

      {/* Titre et numéro du document */}
      <div className={compact ? 'text-center mb-3' : 'mb-5'}>
        <h2
          className={`${compact ? 'text-base' : 'text-2xl'} font-bold`}
          style={{ color: brand.primary }}
        >
          {isEn ? config.labelEn : config.label}
        </h2>
        <p className="text-xs text-slate-500">
          N° {doc.number} · {formatDateShort(doc.createdAt, doc.locale)}
        </p>
      </div>

      {/* Bloc client */}
      {doc.client && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {clientBlockLabel}
          </p>
          <p className="font-bold text-slate-900">{doc.client.name}</p>
          {doc.client.address && <p className="text-xs text-slate-600">{doc.client.address}</p>}
          {doc.client.phone && <p className="text-xs text-slate-600">{doc.client.phone}</p>}
          {doc.client.taxId && (
            <p className="text-xs font-semibold text-slate-700">
              {isEn ? 'Tax ID' : 'NIU'} : {doc.client.taxId}
            </p>
          )}
        </div>
      )}

      {/* Métadonnées du document */}
      <div className="mb-4 space-y-1 text-xs">
        {config.showValidity && doc.payload.validityDays ? (
          <p>
            <span className="text-slate-500">{isEn ? 'Validity:' : 'Validité :'}</span>{' '}
            <span className="font-semibold">
              {doc.payload.validityDays} {isEn ? 'days' : 'jours'}
            </span>
          </p>
        ) : null}
        {config.showDueDate && doc.payload.dueDate ? (
          <p>
            <span className="text-slate-500">{isEn ? 'Due date:' : 'Échéance :'}</span>{' '}
            <span className="font-semibold">
              {formatDateShort(doc.payload.dueDate, doc.locale)}
            </span>
          </p>
        ) : null}
        {config.showReferenceNumber && doc.payload.referenceNumber ? (
          <p>
            <span className="text-slate-500">{isEn ? 'Ref.:' : 'Réf. :'}</span>{' '}
            <span className="font-semibold">{doc.payload.referenceNumber}</span>
          </p>
        ) : null}
        {config.showPaymentInfo && doc.payload.paymentMethod ? (
          <p>
            <span className="text-slate-500">{isEn ? 'Payment:' : 'Paiement :'}</span>{' '}
            <span className="font-semibold">
              {PAYMENT_LABELS[doc.payload.paymentMethod]?.[isEn ? 'en' : 'fr'] ??
                doc.payload.paymentMethod}
              {doc.payload.paymentReference ? ` — ${doc.payload.paymentReference}` : ''}
            </span>
          </p>
        ) : null}
        {config.showNonContractual && (
          <p className="italic text-amber-700">
            {isEn
              ? 'Document without accounting or fiscal value — Proforma Invoice'
              : 'Document sans valeur comptable ou fiscale — Facture Proforma'}
          </p>
        )}
      </div>

      {/* Tableau des lignes */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr
              className="border-b text-xs font-bold"
              style={{ borderColor: brand.primary }}
            >
              <th className="py-1.5 pr-2">{isEn ? 'Description' : 'Désignation'}</th>
              <th className="py-1.5 px-2 text-center">{isEn ? 'Qty' : 'Qté'}</th>
              {!hidePrices && (
                <>
                  <th className="py-1.5 px-2 text-right">
                    {isEn ? 'Unit price' : 'Prix unit.'}
                  </th>
                  <th className="py-1.5 pl-2 text-right">Total</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-dashed divide-slate-200 text-xs">
            {doc.payload.lines.map((line, i) => (
              <tr key={i}>
                <td className="py-2 pr-2">{line.description}</td>
                <td className="py-2 px-2 text-center">{line.quantity}</td>
                {!hidePrices && (
                  <>
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      {formatCurrency(line.unitPrice, currency, doc.locale)}
                    </td>
                    <td className="py-2 pl-2 text-right font-bold whitespace-nowrap">
                      {formatCurrency(line.total, currency, doc.locale)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="flex flex-col items-end space-y-1 text-xs">
        {hidePrices ? (
          <div
            className="mt-2 flex items-baseline gap-3 border-t pt-2"
            style={{ borderColor: brand.primary }}
          >
            <span className="font-bold">
              {isEn ? 'TOTAL ITEMS DELIVERED' : 'TOTAL COLIS / ARTICLES LIVRÉS'}
            </span>
            <span className="text-base font-extrabold" style={{ color: brand.accent }}>
              {totalQty}
            </span>
          </div>
        ) : (
          <>
            <div className="flex gap-4">
              <span className="text-slate-500">{isEn ? 'Subtotal' : 'Sous-total'}</span>
              <span className="font-medium">
                {formatCurrency(doc.payload.subtotal, currency, doc.locale)}
              </span>
            </div>
            {doc.payload.deliveryFee !== null && doc.payload.deliveryFee > 0 && (
              <div className="flex gap-4">
                <span className="text-slate-500">{isEn ? 'Delivery' : 'Livraison'}</span>
                <span className="font-medium">
                  {formatCurrency(doc.payload.deliveryFee, currency, doc.locale)}
                </span>
              </div>
            )}
            {config.showVat && doc.payload.vatAmount !== null && doc.payload.vatRate !== null && (
              <>
                <div className="flex gap-4">
                  <span className="text-slate-500">{isEn ? 'Total excl. VAT' : 'Total HT'}</span>
                  <span className="font-medium">
                    {formatCurrency(
                      doc.payload.subtotal + (doc.payload.deliveryFee ?? 0),
                      currency,
                      doc.locale
                    )}
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-500">
                    {isEn ? 'VAT' : 'TVA'} ({doc.payload.vatRate}%)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(doc.payload.vatAmount, currency, doc.locale)}
                  </span>
                </div>
              </>
            )}
            {doc.payload.depositAmount !== null && doc.payload.depositAmount > 0 && (
              <div className="flex gap-4">
                <span className="text-slate-500">{isEn ? 'Deposit' : 'Acompte'}</span>
                <span className="font-medium">
                  −{formatCurrency(doc.payload.depositAmount, currency, doc.locale)}
                </span>
              </div>
            )}
            <div
              className="mt-2 flex items-baseline gap-4 border-t pt-2"
              style={{ borderColor: brand.primary }}
            >
              <span className="text-sm font-bold">TOTAL</span>
              <span
                className={`${compact ? 'text-base' : 'text-xl'} font-extrabold`}
                style={{ color: brand.accent }}
              >
                {formatCurrency(doc.payload.total, currency, doc.locale)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Notes */}
      {doc.payload.notes && (
        <p className="mt-3 text-xs italic text-slate-600">
          Note : {doc.payload.notes}
        </p>
      )}

      {/* Pied de page + QR Code */}
      <div className="mt-5 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
        {doc.qrCodeDataUrl && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.qrCodeDataUrl}
              alt="QR Code"
              className="h-14 w-14 rounded border border-slate-200 p-0.5"
            />
            <span className="text-[10px] text-slate-500">
              {isEn ? 'Scan to verify authenticity' : "Scanner pour vérifier l'authenticité"}
            </span>
          </div>
        )}
        {(doc.cgvText ?? doc.company.cgvText) && (
          <p className="mb-1 text-[10px] text-slate-500">
            {doc.cgvText ?? doc.company.cgvText}
          </p>
        )}
        {!doc.whiteLabel && (
          <p className="text-[10px] text-slate-400">
            {isEn
              ? 'Issued via MyCashBill — Electronic document.'
              : 'Émis via MyCashBill — Document généré électroniquement.'}
          </p>
        )}
      </div>
    </div>
  );
}
