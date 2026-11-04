import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PdfPayload } from '../types';
import { formatXaf } from './format';

export function Totals({ payload, compact, currency }: { payload: PdfPayload; compact: boolean; currency: string }) {
  const styles = StyleSheet.create({
    block: { marginTop: 8, alignItems: 'flex-end' },
    line: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 },
    label: { fontSize: compact ? 8 : 10, color: '#64748B', marginRight: 8 },
    value: { fontSize: compact ? 8 : 10, color: '#0F172A' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderColor: '#0F172A' },
    totalLabel: { fontSize: compact ? 10 : 12, fontWeight: 'bold', marginRight: 8 },
    totalValue: { fontSize: compact ? 14 : 18, fontWeight: 'bold', color: '#C98773' },
  });

  return (
    <View style={styles.block}>
      <View style={styles.line}>
        <Text style={styles.label}>Sous-total</Text>
        <Text style={styles.value}>{formatXaf(payload.subtotal, currency)}</Text>
      </View>
      {payload.vatAmount !== null && payload.vatRate !== null && (
        <View style={styles.line}>
          <Text style={styles.label}>TVA ({payload.vatRate}%)</Text>
          <Text style={styles.value}>{formatXaf(payload.vatAmount, currency)}</Text>
        </View>
      )}
      {payload.deliveryFee !== null && payload.deliveryFee > 0 && (
        <View style={styles.line}>
          <Text style={styles.label}>Livraison</Text>
          <Text style={styles.value}>{formatXaf(payload.deliveryFee, currency)}</Text>
        </View>
      )}
      {payload.depositAmount !== null && payload.depositAmount > 0 && (
        <View style={styles.line}>
          <Text style={styles.label}>Acompte</Text>
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

