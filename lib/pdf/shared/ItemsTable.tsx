import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfLine } from '../types';
import { formatAmount, currencyLabel, type DecimalPlaces } from './format';
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
  const unit = currencyLabel(currency, locale);

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: PDF_TOKENS.neutral.surfaceAlt,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: primaryColor,
      paddingVertical: compact ? 3 : 6,
      paddingHorizontal: compact ? 4 : 8,
      marginBottom: 2,
    },
    headerText: {
      fontWeight: 'bold',
      fontSize: compact ? 7 : 8.5,
      color: PDF_TOKENS.neutral.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: compact ? 3 : 6,
      paddingHorizontal: compact ? 4 : 8,
      borderBottomWidth: 0.5,
      borderColor: PDF_TOKENS.neutral.line,
    },
    rowAlt: { backgroundColor: PDF_TOKENS.neutral.zebra },
    // A4 : colonnes dimensionnées pour des montants jusqu'à 12 chiffres, la description prend le reste.
    colDesc: { flex: 1, paddingRight: 8, fontSize: 10.5, color: PDF_TOKENS.neutral.ink },
    colQty: { width: hidePrices ? 70 : 40, textAlign: hidePrices ? 'right' : 'center', fontSize: 10.5, color: PDF_TOKENS.neutral.subdued },
    colPrice: { width: 100, textAlign: 'right', fontSize: 10.5, color: PDF_TOKENS.neutral.subdued },
    colTotal: { width: 110, textAlign: 'right', fontSize: 10.5, fontWeight: 'bold', color: PDF_TOKENS.neutral.ink },
    // Ticket : description pleine largeur, puis « qté × prix » à gauche et total à droite.
    cRow: {
      flexDirection: 'column',
      alignItems: 'stretch',
      paddingVertical: 3.5,
      paddingHorizontal: 4,
      borderBottomWidth: 0.5,
      borderColor: PDF_TOKENS.neutral.line,
    },
    cDesc: { fontSize: 8.5, color: PDF_TOKENS.neutral.ink, lineHeight: 1.25 },
    cSub: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 2,
    },
    cSubText: { fontSize: 7.5, color: PDF_TOKENS.neutral.muted },
    cTotal: { fontSize: 8.5, fontWeight: 'bold', color: PDF_TOKENS.neutral.ink },
    flex1: { flex: 1 },
  });

  if (compact) {
    return (
      <View>
        <View style={styles.header}>
          <Text style={[styles.flex1, styles.headerText]}>{isEn ? 'Description' : 'Désignation'}</Text>
          <Text style={styles.headerText}>{hidePrices ? (isEn ? 'Qty' : 'Qté') : `Total (${unit})`}</Text>
        </View>
        {lines.map((line, i) => (
          <View key={i} wrap={false} style={[styles.cRow, i % 2 === 1 ? styles.rowAlt : {}]}>
            <Text style={styles.cDesc}>{line.description}</Text>
            <View style={styles.cSub}>
              {hidePrices ? (
                <Text style={styles.cTotal}>{line.quantity}</Text>
              ) : (
                <>
                  <Text style={styles.cSubText}>
                    {line.quantity} × {formatAmount(line.unitPrice, locale, decimals)}
                  </Text>
                  <Text style={styles.cTotal}>{formatAmount(line.total, locale, decimals)}</Text>
                </>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.colDesc, styles.headerText, { fontSize: 8.5 }]}>
          {isEn ? 'Description' : 'Désignation'}
        </Text>
        <Text style={[styles.colQty, styles.headerText, { fontSize: 8.5 }]}>{isEn ? 'Qty' : 'Qté'}</Text>
        {!hidePrices ? (
          <>
            <Text style={[styles.colPrice, styles.headerText, { fontSize: 8.5 }]}>
              {isEn ? 'Unit price' : 'Prix unit.'} ({unit})
            </Text>
            <Text style={[styles.colTotal, styles.headerText, { fontSize: 8.5 }]}>Total ({unit})</Text>
          </>
        ) : null}
      </View>
      {lines.map((line, i) => (
        <View key={i} wrap={false} style={[styles.row, i % 2 === 1 ? styles.rowAlt : {}]}>
          <Text style={styles.colDesc}>{line.description}</Text>
          <Text style={styles.colQty}>{line.quantity}</Text>
          {!hidePrices ? (
            <>
              <Text style={styles.colPrice}>{formatAmount(line.unitPrice, locale, decimals)}</Text>
              <Text style={styles.colTotal}>{formatAmount(line.total, locale, decimals)}</Text>
            </>
          ) : null}
        </View>
      ))}
    </View>
  );
}
