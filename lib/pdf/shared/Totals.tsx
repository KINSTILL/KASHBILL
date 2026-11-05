import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfPayload } from '../types';
import { formatXaf } from './format';

export function Totals({
  payload,
  compact,
  currency,
  showVat = false,
  hidePrices = false,
  locale = 'FR',
}: {
  payload: PdfPayload;
  compact: boolean;
  currency: string;
  showVat?: boolean;
  hidePrices?: boolean;
  locale?: Locale;
}) {
  const isEn = locale === 'EN';

  const styles = StyleSheet.create({
    block: { marginTop: 8, alignItems: 'flex-end' },
    line: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
    label: { fontSize: compact ? 8 : 10, color: '#64748B', marginRight: 8 },
    value: { fontSize: compact ? 8 : 10, color: '#0F172A' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderColor: '#0F172A' },
    totalLabel: { fontSize: compact ? 10 : 12, fontWeight: 'bold', marginRight: 8 },
    totalValue: { fontSize: compact ? 14 : 18, fontWeight: 'bold', color: '#C98773' },
  });

  if (hidePrices) {
    const totalQty = payload.lines.reduce((acc, l) => acc + l.quantity, 0);
    return (
      <View style={styles.block}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {isEn ? 'TOTAL ITEMS DELIVERED' : 'TOTAL COLIS / ARTICLES LIVRÉS'}
          </Text>
          <Text style={styles.totalValue}>{totalQty}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <View style={styles.line}>
        <Text style={styles.label}>{isEn ? 'Subtotal' : 'Sous-total'}</Text>
        <Text style={styles.value}>{formatXaf(payload.subtotal, currency)}</Text>
      </View>
      {showVat && payload.vatAmount !== null && payload.vatRate !== null ? (
        <View style={styles.line}>
          <Text style={styles.label}>
            {isEn ? 'VAT' : 'TVA'} ({payload.vatRate}%)
          </Text>
          <Text style={styles.value}>{formatXaf(payload.vatAmount, currency)}</Text>
        </View>
      ) : null}
      {payload.deliveryFee !== null && payload.deliveryFee > 0 && (
        <View style={styles.line}>
          <Text style={styles.label}>{isEn ? 'Delivery' : 'Livraison'}</Text>
          <Text style={styles.value}>{formatXaf(payload.deliveryFee, currency)}</Text>
        </View>
      )}
      {payload.depositAmount !== null && payload.depositAmount > 0 && (
        <View style={styles.line}>
          <Text style={styles.label}>{isEn ? 'Deposit' : 'Acompte'}</Text>
          <Text style={styles.value}>−{formatXaf(payload.depositAmount, currency)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{formatXaf(payload.total, currency)}</Text>
      </View>
    </View>
  );
}
