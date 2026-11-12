import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfClient } from '../types';
import { PDF_TOKENS } from '../brand';

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
      backgroundColor: PDF_TOKENS.neutral.surface,
      borderRadius: PDF_TOKENS.radius.lg,
      borderWidth: 0.5,
      borderColor: PDF_TOKENS.neutral.line,
    },
    label: {
      fontSize: compact ? 6 : 8,
      color: PDF_TOKENS.neutral.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    name: { fontSize: compact ? 10 : 11, fontWeight: 'bold', color: PDF_TOKENS.neutral.ink },
    line: { fontSize: compact ? 7 : 9, color: PDF_TOKENS.neutral.subdued, marginTop: 1 },
    taxId: { fontSize: compact ? 7 : 9, color: PDF_TOKENS.neutral.subdued, marginTop: 1, fontWeight: 'bold' },
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
