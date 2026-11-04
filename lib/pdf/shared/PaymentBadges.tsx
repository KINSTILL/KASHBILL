import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badgeOM: {
    backgroundColor: '#FFEDD5',
    color: '#EA580C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeMoMo: {
    backgroundColor: '#FEF9C3',
    color: '#854D0E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export function PaymentBadges({ compact = false }: { compact?: boolean } = {}) {
  void compact;
  return (
    <View style={styles.row}>
      <Text style={styles.badgeOM}>Orange Money</Text>
      <Text style={styles.badgeMoMo}>MTN MoMo</Text>
    </View>
  );
}
