import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PdfDocument } from '../types';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatDateShort, formatCurrency, type DecimalPlaces } from './format';
import { PDF_TOKENS } from '../brand';

const PAYMENT_LABELS: Record<string, { fr: string; en: string }> = {
  CASH: { fr: 'Espèces', en: 'Cash' },
  MOBILE_MONEY: { fr: 'Mobile Money', en: 'Mobile Money' },
  BANK_TRANSFER: { fr: 'Virement bancaire', en: 'Bank transfer' },
  CHECK: { fr: 'Chèque', en: 'Check' },
};

export function DocumentMeta({
  doc,
  compact,
  decimals = 0,
}: {
  doc: PdfDocument;
  compact: boolean;
  decimals?: DecimalPlaces;
}) {
  const config = DOC_TYPE_CONFIG[doc.type];
  const isFr = doc.locale === 'FR';

  const styles = StyleSheet.create({
    block: { marginBottom: compact ? 8 : 16 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2, alignItems: 'baseline' },
    label: {
      fontSize: compact ? 7 : 9,
      color: PDF_TOKENS.neutral.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    value: { fontSize: compact ? 7 : 9, color: PDF_TOKENS.neutral.ink, fontWeight: 'bold' },
    // Badge-pilule (inspiration marketing) pour la mention non-contractuelle
    warnPill: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingVertical: compact ? 2 : 3,
      paddingHorizontal: compact ? 5 : 7,
      borderRadius: PDF_TOKENS.radius.pill,
      backgroundColor: '#FEF3C7',
      borderWidth: 0.5,
      borderColor: '#FCD34D',
    },
    warn: {
      fontSize: compact ? 6 : 8,
      color: '#92400E',
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.block}>
      {config.showValidity && doc.payload.validityDays ? (
        <View style={styles.row}>
          <Text style={styles.label}>{isFr ? 'Validité :' : 'Validity:'}</Text>
          <Text style={styles.value}>
            {isFr
              ? `${doc.payload.validityDays} jours`
              : `${doc.payload.validityDays} days`}
          </Text>
        </View>
      ) : null}

      {config.showDueDate && doc.payload.dueDate ? (
        <View style={styles.row}>
          <Text style={styles.label}>{isFr ? 'Échéance :' : 'Due date:'}</Text>
          <Text style={styles.value}>
            {formatDateShort(new Date(doc.payload.dueDate), doc.locale)}
          </Text>
        </View>
      ) : null}

      {config.showReferenceNumber && doc.payload.referenceNumber ? (
        <View style={styles.row}>
          <Text style={styles.label}>{isFr ? 'Réf. :' : 'Ref.:'}</Text>
          <Text style={styles.value}>{doc.payload.referenceNumber}</Text>
        </View>
      ) : null}

      {config.showPaymentInfo && doc.payload.paymentMethod ? (
        <View style={styles.row}>
          <Text style={styles.label}>{isFr ? 'Paiement :' : 'Payment:'}</Text>
          <Text style={styles.value}>
            {PAYMENT_LABELS[doc.payload.paymentMethod]?.[doc.locale === 'FR' ? 'fr' : 'en'] ??
              doc.payload.paymentMethod}
            {doc.payload.paymentReference ? ` — ${doc.payload.paymentReference}` : ''}
          </Text>
        </View>
      ) : null}

      {config.showShipmentDetails &&
      (doc.payload.deliveryDate || doc.payload.deliveryAddress) ? (
        <View style={styles.row}>
          <Text style={styles.label}>{isFr ? 'Livraison :' : 'Delivery:'}</Text>
          <Text style={styles.value}>
            {doc.payload.deliveryDate
              ? formatDateShort(new Date(doc.payload.deliveryDate), doc.locale)
              : ''}
            {doc.payload.deliveryAddress ? ` — ${doc.payload.deliveryAddress}` : ''}
          </Text>
        </View>
      ) : null}

      {config.showNonContractual ? (
        <View style={styles.warnPill}>
          <Text style={styles.warn}>
            {isFr
              ? 'Document sans valeur comptable ou fiscale — Facture Proforma'
              : 'Document without accounting or fiscal value — Proforma Invoice'}
          </Text>
        </View>
      ) : null}

      {doc.payload.equivalentAmount && doc.payload.equivalentCurrency ? (
        <View style={styles.row}>
          <Text style={styles.label}>
            {isFr ? 'Équivalent :' : 'Equivalent:'}
          </Text>
          <Text style={styles.value}>
            ≈ {formatCurrency(doc.payload.equivalentAmount, doc.payload.equivalentCurrency, doc.locale, decimals)}
            {doc.payload.exchangeRate
              ? ` (${isFr ? 'taux' : 'rate'} : ${doc.payload.exchangeRate})`
              : ''}
          </Text>
        </View>
      ) : null}
      {doc.payload.exchangeRateNote ? (
        <Text style={[styles.label, { marginTop: 2, fontSize: compact ? 6 : 8, fontStyle: 'italic' }]}>
          {doc.payload.exchangeRateNote}
        </Text>
      ) : null}
    </View>
  );
}
