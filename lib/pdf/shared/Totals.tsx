import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfPayload } from '../types';
import { formatCurrency, type DecimalPlaces } from './format';
import { DEFAULT_BRAND, PDF_TOKENS, readableOn } from '../brand';

export function Totals({
  payload,
  compact,
  currency,
  showVat = false,
  hidePrices = false,
  locale = 'FR',
  primaryColor = DEFAULT_BRAND.primary,
  accentColor = DEFAULT_BRAND.accent,
  decimals = 0,
}: {
  payload: PdfPayload;
  compact: boolean;
  currency: string;
  showVat?: boolean;
  hidePrices?: boolean;
  locale?: Locale;
  primaryColor?: string;
  accentColor?: string;
  decimals?: DecimalPlaces;
}) {
  const isEn = locale === 'EN';
  const onPrimary = readableOn(primaryColor);

  const styles = StyleSheet.create({
    // Ticket : pleine largeur. A4 : bloc aligné à droite.
    block: { marginTop: compact ? 8 : 14, alignItems: compact ? 'stretch' : 'flex-end' },
    lines: { width: compact ? '100%' : 270 },
    line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: compact ? 2 : 3 },
    label: { fontSize: compact ? 8 : 10, color: PDF_TOKENS.neutral.muted },
    value: { fontSize: compact ? 8.5 : 10.5, color: PDF_TOKENS.neutral.ink },
    // Encadré du total : libellé au-dessus, montant dessous aligné à droite (aucun risque de chevauchement).
    totalBox: {
      marginTop: compact ? 4 : 6,
      paddingVertical: compact ? 5 : 8,
      paddingHorizontal: compact ? 8 : 12,
      backgroundColor: primaryColor,
      borderBottomWidth: 3,
      borderColor: accentColor,
      borderRadius: PDF_TOKENS.radius.md,
      width: compact ? '100%' : 270,
    },
    totalLabel: {
      fontSize: compact ? 7.5 : 9,
      fontWeight: 'bold',
      color: onPrimary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    totalValue: {
      marginTop: 2,
      textAlign: 'right',
      fontSize: compact ? 15 : 20,
      fontWeight: 'bold',
      color: onPrimary,
    },
  });

  if (hidePrices) {
    const totalQty = payload.lines.reduce((acc, l) => acc + l.quantity, 0);
    return (
      <View style={styles.block} wrap={false}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>
            {isEn ? 'TOTAL ITEMS DELIVERED' : 'TOTAL COLIS / ARTICLES LIVRÉS'}
          </Text>
          <Text style={styles.totalValue}>{totalQty}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.block} wrap={false}>
      <View style={styles.lines}>
        <View style={styles.line}>
          <Text style={styles.label}>{isEn ? 'Subtotal' : 'Sous-total'}</Text>
          <Text style={styles.value}>{formatCurrency(payload.subtotal, currency, locale, decimals)}</Text>
        </View>
        {payload.deliveryFee !== null && payload.deliveryFee > 0 && (
          <View style={styles.line}>
            <Text style={styles.label}>{isEn ? 'Delivery' : 'Livraison'}</Text>
            <Text style={styles.value}>{formatCurrency(payload.deliveryFee, currency, locale, decimals)}</Text>
          </View>
        )}
        {showVat && payload.vatAmount !== null && payload.vatRate !== null ? (
          <>
            <View style={styles.line}>
              <Text style={styles.label}>{isEn ? 'Total excl. VAT' : 'Total HT'}</Text>
              <Text style={styles.value}>
                {formatCurrency(payload.subtotal + (payload.deliveryFee ?? 0), currency, locale, decimals)}
              </Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.label}>
                {isEn ? 'VAT' : 'TVA'} ({payload.vatRate}%)
              </Text>
              <Text style={styles.value}>{formatCurrency(payload.vatAmount, currency, locale, decimals)}</Text>
            </View>
          </>
        ) : null}
        {payload.depositAmount !== null && payload.depositAmount > 0 && (
          <View style={styles.line}>
            <Text style={styles.label}>{isEn ? 'Deposit' : 'Acompte'}</Text>
            <Text style={styles.value}>- {formatCurrency(payload.depositAmount, currency, locale, decimals)}</Text>
          </View>
        )}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{isEn ? 'NET DUE' : 'NET À PAYER'}</Text>
          <Text style={styles.totalValue}>{formatCurrency(payload.total, currency, locale, decimals)}</Text>
        </View>
      </View>
    </View>
  );
}
