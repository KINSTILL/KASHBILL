import { View, Text, StyleSheet } from '@react-pdf/renderer';

type Props = {
  compact?: boolean;
  method: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHECK' | null;
  operatorName: string | null;
  operatorFreeText: string | null;
  locale: 'FR' | 'EN';
};

export function PaymentBadges({ compact, method, operatorName, operatorFreeText, locale }: Props) {
  if (!method) return null;

  const styles = StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: compact ? 7 : 8,
      fontWeight: 'bold',
    },
    methodBadge: { backgroundColor: '#F1F5F9', color: '#0B1220' },
    operatorBadge: { backgroundColor: '#FFEDD5', color: '#EA580C' },
    freeBadge: { backgroundColor: '#FEF9C3', color: '#854D0E' },
  });

  const methodLabel = {
    CASH: locale === 'FR' ? 'Espèces' : 'Cash',
    MOBILE_MONEY: 'Mobile Money',
    BANK_TRANSFER: locale === 'FR' ? 'Virement' : 'Bank Transfer',
    CHECK: locale === 'FR' ? 'Chèque' : 'Check',
  }[method];

  return (
    <View style={styles.row}>
      <Text style={[styles.badge, styles.methodBadge]}>{methodLabel}</Text>
      {operatorName && <Text style={[styles.badge, styles.operatorBadge]}>{operatorName}</Text>}
      {operatorFreeText && <Text style={[styles.badge, styles.freeBadge]}>{operatorFreeText}</Text>}
    </View>
  );
}
