import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PdfLine } from '../types';
import { formatXaf } from './format';

type Props = {
  lines: PdfLine[];
  compact: boolean;
  currency: string;
};

export function ItemsTable({ lines, compact, currency }: Props) {
  const styles = StyleSheet.create({
    header: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#0F172A', paddingBottom: 3, marginBottom: 3 },
    row: { flexDirection: 'row', paddingVertical: 2, borderBottomWidth: 0.5, borderColor: '#E2E8F0', borderStyle: 'dashed' },
    colDesc: { flex: 3, fontSize: compact ? 8 : 10 },
    colQty: { width: 30, fontSize: compact ? 8 : 10, textAlign: 'center' },
    colPrice: { width: compact ? 60 : 80, fontSize: compact ? 8 : 10, textAlign: 'right' },
    colTotal: { width: compact ? 70 : 90, fontSize: compact ? 8 : 10, textAlign: 'right', fontWeight: 'bold' },
    headerText: { fontWeight: 'bold', fontSize: compact ? 8 : 10 },
  });

  return (
    <View>
      <View style={styles.header}>
        <Text style={[styles.colDesc, styles.headerText]}>Désignation</Text>
        <Text style={[styles.colQty, styles.headerText]}>Qté</Text>
        <Text style={[styles.colPrice, styles.headerText]}>Prix unit.</Text>
        <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
      </View>
      {lines.map((line, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.colDesc}>{line.description}</Text>
          <Text style={styles.colQty}>{line.quantity}</Text>
          <Text style={styles.colPrice}>{formatXaf(line.unitPrice, currency)}</Text>
          <Text style={styles.colTotal}>{formatXaf(line.total, currency)}</Text>
        </View>
      ))}
    </View>
  );
}

