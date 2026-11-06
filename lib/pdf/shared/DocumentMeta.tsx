import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PdfDocument } from '../types';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatDateShort } from './format';

const PAYMENT_LABELS: Record<string, { fr: string; en: string }> = {
  CASH: { fr: 'Espèces', en: 'Cash' },
  MOBILE_MONEY: { fr: 'Mobile Money', en: 'Mobile Money' },
  BANK_TRANSFER: { fr: 'Virement bancaire', en: 'Bank transfer' },
  CHECK: { fr: 'Chèque', en: 'Check' },
};

export function DocumentMeta({ doc, compact }: { doc: PdfDocument; compact: boolean }) {
  const config = DOC_TYPE_CONFIG[doc.type];
  const isFr = doc.locale === 'FR';

  const styles = StyleSheet.create({
    block: { marginBottom: compact ? 8 : 16 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
    label: { fontSize: compact ? 7 : 9, color: '#64748B' },
    value: { fontSize: compact ? 7 : 9, color: '#0F172A', fontWeight: 'bold' },
    warn: {
      fontSize: compact ? 7 : 9,
      color: '#B5613D',
      fontStyle: 'italic',
      marginTop: 4,
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
            {formatDateShort(new Date(doc.payload.dueDate))}
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
              ? formatDateShort(new Date(doc.payload.deliveryDate))
              : ''}
            {doc.payload.deliveryAddress ? ` — ${doc.payload.deliveryAddress}` : ''}
          </Text>
        </View>
      ) : null}

      {config.showNonContractual ? (
        <Text style={styles.warn}>
          {isFr
            ? 'Document sans valeur comptable ou fiscale — Facture Proforma'
            : 'Document without accounting or fiscal value — Proforma Invoice'}
        </Text>
      ) : null}
    </View>
  );
}
