import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfClient } from '../types';

export function ClientBlock({
  client,
  compact,
  label,
  locale = 'FR',
}: {
  client: PdfClient;
  compact: boolean;
  label?: string;
  locale?: Locale;
}) {
  const isEn = locale === 'EN';
  const styles = StyleSheet.create({
    block: {
      marginBottom: compact ? 8 : 16,
      padding: compact ? 6 : 10,
      backgroundColor: '#F8FAFC',
      borderRadius: 4,
    },
    label: {
      fontSize: compact ? 6 : 8,
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    name: { fontSize: compact ? 10 : 11, fontWeight: 'bold', color: '#0F172A' },
    line: { fontSize: compact ? 7 : 9, color: '#475569', marginTop: 1 },
    taxId: { fontSize: compact ? 7 : 9, color: '#475569', marginTop: 1, fontWeight: 'bold' },
  });

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label ?? (isEn ? 'Client' : 'Client')}</Text>
      <Text style={styles.name}>{client.name}</Text>
      {client.address && <Text style={styles.line}>{client.address}</Text>}
      {client.phone && <Text style={styles.line}>{client.phone}</Text>}
      {client.taxId && <Text style={styles.taxId}>{isEn ? 'Tax ID' : 'NIU'} : {client.taxId}</Text>}
    </View>
  );
}
