import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfLine } from '../types';
import { formatCurrency, type DecimalPlaces } from './format';
import { DEFAULT_BRAND, PDF_TOKENS } from '../brand';

type Props = {
  lines: PdfLine[];
  compact: boolean;
  currency: string;
  showVat?: boolean;
  hidePrices?: boolean;
  locale?: Locale;
  primaryColor?: string;
  decimals?: DecimalPlaces;
};

export function ItemsTable({
  lines,
  compact,
  currency,
  hidePrices = false,
  locale = 'FR',
  primaryColor = DEFAULT_BRAND.primary,
  decimals = 0,
}: Props) {
  const isEn = locale === 'EN';

  const styles = StyleSheet.create({
    // En-tête tableau : fond neutre, texte en petites capitales (inspiration marketing)
    header: {
      flexDirection: 'row',
      backgroundColor: PDF_TOKENS.neutral.surfaceAlt,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: primaryColor,
      paddingVertical: compact ? 3 : 5,
      paddingHorizontal: compact ? 4 : 6,
      borderTopLeftRadius: PDF_TOKENS.radius.sm,
      borderTopRightRadius: PDF_TOKENS.radius.sm,
      marginBottom: 2,
    },
    row: {
      flexDirection: 'row',
      paddingVertical: compact ? 2.5 : 4,
      paddingHorizontal: compact ? 4 : 6,
      borderBottomWidth: 0.5,
      borderColor: PDF_TOKENS.neutral.line,
    },
    rowAlt: { backgroundColor: PDF_TOKENS.neutral.zebra },
    colDesc: { flex: 3, fontSize: compact ? 8 : 10, color: PDF_TOKENS.neutral.ink },
    colQty: { width: hidePrices ? 60 : 30, fontSize: compact ? 8 : 10, textAlign: hidePrices ? 'right' : 'center', color: PDF_TOKENS.neutral.subdued },
    colPrice: { width: compact ? 60 : 80, fontSize: compact ? 8 : 10, textAlign: 'right', color: PDF_TOKENS.neutral.subdued, fontFamily: 'Courier' },
    colVat: { width: compact ? 40 : 50, fontSize: compact ? 8 : 10, textAlign: 'right' },
    colTotal: { width: compact ? 70 : 90, fontSize: compact ? 8 : 10, textAlign: 'right', fontWeight: 'bold', color: PDF_TOKENS.neutral.ink, fontFamily: 'Courier' },
    headerText: {
      fontWeight: 'bold',
      fontSize: compact ? 7.5 : 9,
      color: PDF_TOKENS.neutral.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
  });

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.colDesc, styles.headerText]}>
          {isEn ? 'Description' : 'Désignation'}
        </Text>
        <Text style={[styles.colQty, styles.headerText]}>
          {isEn ? 'Qty' : 'Qté'}
        </Text>
        {!hidePrices ? (
          <>
            <Text style={[styles.colPrice, styles.headerText]}>
              {isEn ? 'Unit price' : 'Prix unit.'}
            </Text>
            <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
          </>
        ) : null}
      </View>
      {lines.map((line, i) => (
        <View key={i} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
          <Text style={styles.colDesc}>{line.description}</Text>
          <Text style={styles.colQty}>{line.quantity}</Text>
          {!hidePrices ? (
            <>
              <Text style={styles.colPrice}>{formatCurrency(line.unitPrice, currency, locale, decimals)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(line.total, currency, locale, decimals)}</Text>
            </>
          ) : null}
        </View>
      ))}
    </View>
  );
}
