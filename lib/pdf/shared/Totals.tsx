import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfPayload } from '../types';
import { formatCurrency } from './format';
import { DEFAULT_BRAND } from '../brand';

export function Totals({
  payload,
  compact,
  currency,
  showVat = false,
  hidePrices = false,
  locale = 'FR',
  primaryColor = DEFAULT_BRAND.primary,
  accentColor = DEFAULT_BRAND.accent,
}: {
  payload: PdfPayload;
  compact: boolean;
  currency: string;
  showVat?: boolean;
  hidePrices?: boolean;
  locale?: Locale;
  primaryColor?: string;
  accentColor?: string;
}) {
  const isEn = locale === 'EN';

  const styles = StyleSheet.create({
    block: { marginTop: 8, alignItems: 'flex-end' },
    line: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
    label: { fontSize: compact ? 8 : 10, color: '#64748B', marginRight: 8 },
    value: { fontSize: compact ? 8 : 10, color: '#0F172A' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderColor: primaryColor },
    totalLabel: { fontSize: compact ? 10 : 12, fontWeight: 'bold', marginRight: 8 },
    totalValue: { fontSize: compact ? 14 : 18, fontWeight: 'bold', color: accentColor },
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
        <Text style={styles.value}>{formatCurrency(payload.subtotal, currency, locale)}</Text>
      </View>
      {showVat && payload.vatAmount !== null && payload.vatRate !== null ? (
        <View style={styles.line}>
          <Text style={styles.label}>
            {isEn ? 'VAT' : 'TVA'} ({payload.vatRate}%)
          </Text>
          <Text style={styles.value}>{formatCurrency(payload.vatAmount, currency, locale)}</Text>
        </View>
      ) : null}
      {payload.deliveryFee !== null && payload.deliveryFee > 0 && (
        <View style={styles.line}>
          <Text style={styles.label}>{isEn ? 'Delivery' : 'Livraison'}</Text>
          <Text style={styles.value}>{formatCurrency(payload.deliveryFee, currency, locale)}</Text>
        </View>
      )}
      {payload.depositAmount !== null && payload.depositAmount > 0 && (
        <View style={styles.line}>
          <Text style={styles.label}>{isEn ? 'Deposit' : 'Acompte'}</Text>
          <Text style={styles.value}>−{formatCurrency(payload.depositAmount, currency, locale)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>{formatCurrency(payload.total, currency, locale)}</Text>
      </View>
    </View>
  );
}
