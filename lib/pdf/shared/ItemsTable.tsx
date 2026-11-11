import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfLine } from '../types';
import { formatCurrency } from './format';
import { DEFAULT_BRAND } from '../brand';

type Props = {
  lines: PdfLine[];
  compact: boolean;
  currency: string;
  showVat?: boolean;
  hidePrices?: boolean;
  locale?: Locale;
  primaryColor?: string;
};

export function ItemsTable({
  lines,
  compact,
  currency,
  hidePrices = false,
  locale = 'FR',
  primaryColor = DEFAULT_BRAND.primary,
}: Props) {
  const isEn = locale === 'EN';

  const styles = StyleSheet.create({
    header: { flexDirection: 'row', borderBottomWidth: 1, borderColor: primaryColor, paddingBottom: 3, marginBottom: 3 },
    row: { flexDirection: 'row', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E2E8F0', borderStyle: 'dashed' },
    colDesc: { flex: 3, fontSize: compact ? 8 : 10 },
    colQty: { width: hidePrices ? 60 : 30, fontSize: compact ? 8 : 10, textAlign: hidePrices ? 'right' : 'center' },
    colPrice: { width: compact ? 60 : 80, fontSize: compact ? 8 : 10, textAlign: 'right' },
    colVat: { width: compact ? 40 : 50, fontSize: compact ? 8 : 10, textAlign: 'right' },
    colTotal: { width: compact ? 70 : 90, fontSize: compact ? 8 : 10, textAlign: 'right', fontWeight: 'bold' },
    headerText: { fontWeight: 'bold', fontSize: compact ? 8 : 10 },
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
        <View key={i} style={styles.row}>
          <Text style={styles.colDesc}>{line.description}</Text>
          <Text style={styles.colQty}>{line.quantity}</Text>
          {!hidePrices ? (
            <>
              <Text style={styles.colPrice}>{formatCurrency(line.unitPrice, currency, locale)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(line.total, currency, locale)}</Text>
            </>
          ) : null}
        </View>
      ))}
    </View>
  );
}
