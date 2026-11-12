import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfPayload } from '../types';
import { formatCurrency } from './format';
import { DEFAULT_BRAND, PDF_TOKENS } from '../brand';

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
    block: { marginTop: compact ? 8 : 12, alignItems: 'flex-end' },
    lines: { width: compact ? 150 : 220 },
    line: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    label: { fontSize: compact ? 8 : 10, color: PDF_TOKENS.neutral.muted },
    value: { fontSize: compact ? 8 : 10, color: PDF_TOKENS.neutral.ink, fontFamily: 'Courier' },
    // Bloc total mis en valeur (inspiration marketing)
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
      paddingTop: compact ? 4 : 6,
      paddingHorizontal: compact ? 6 : 8,
      paddingBottom: compact ? 3 : 5,
      borderTopWidth: 1.5,
      borderColor: primaryColor,
      backgroundColor: PDF_TOKENS.neutral.surface,
      borderRadius: PDF_TOKENS.radius.md,
      width: compact ? 150 : 220,
    },
    totalLabel: { fontSize: compact ? 9 : 11, fontWeight: 'bold', color: PDF_TOKENS.neutral.ink, letterSpacing: 0.3 },
    totalValue: { fontSize: compact ? 14 : 18, fontWeight: 'bold', color: accentColor, fontFamily: 'Courier' },
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
      <View style={styles.lines}>
        <View style={styles.line}>
          <Text style={styles.label}>{isEn ? 'Subtotal' : 'Sous-total'}</Text>
          <Text style={styles.value}>{formatCurrency(payload.subtotal, currency, locale)}</Text>
        </View>
        {payload.deliveryFee !== null && payload.deliveryFee > 0 && (
          <View style={styles.line}>
            <Text style={styles.label}>{isEn ? 'Delivery' : 'Livraison'}</Text>
            <Text style={styles.value}>{formatCurrency(payload.deliveryFee, currency, locale)}</Text>
          </View>
        )}
        {showVat && payload.vatAmount !== null && payload.vatRate !== null ? (
          <>
            <View style={styles.line}>
              <Text style={styles.label}>{isEn ? 'Total excl. VAT' : 'Total HT'}</Text>
              <Text style={styles.value}>
                {formatCurrency(payload.subtotal + (payload.deliveryFee ?? 0), currency, locale)}
              </Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.label}>
                {isEn ? 'VAT' : 'TVA'} ({payload.vatRate}%)
              </Text>
              <Text style={styles.value}>{formatCurrency(payload.vatAmount, currency, locale)}</Text>
            </View>
          </>
        ) : null}
        {payload.depositAmount !== null && payload.depositAmount > 0 && (
          <View style={styles.line}>
            <Text style={styles.label}>{isEn ? 'Deposit' : 'Acompte'}</Text>
            <Text style={styles.value}>−{formatCurrency(payload.depositAmount, currency, locale)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{isEn ? 'NET DUE' : 'NET À PAYER'}</Text>
          <Text style={styles.totalValue}>{formatCurrency(payload.total, currency, locale)}</Text>
        </View>
      </View>
    </View>
  );
}
