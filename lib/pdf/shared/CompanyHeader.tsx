/* eslint-disable jsx-a11y/alt-text */
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { PdfCompany } from '../types';

export function CompanyHeader({ company, compact }: { company: PdfCompany; compact: boolean }) {
  const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: compact ? 6 : 12 },
    logo: { width: compact ? 40 : 60, height: compact ? 40 : 60, objectFit: 'contain', marginRight: 10 },
    info: { flex: 1 },
    name: { fontSize: compact ? 12 : 16, fontWeight: 'bold', color: '#0F172A' },
    line: { fontSize: compact ? 7 : 9, color: '#475569', marginTop: 1 },
  });

  return (
    <View style={styles.row}>
      {company.logoUrl && <Image src={company.logoUrl} style={styles.logo} />}
      <View style={styles.info}>
        <Text style={styles.name}>{company.businessName ?? company.legalName ?? 'Mon entreprise'}</Text>
        {company.legalAddress && <Text style={styles.line}>{company.legalAddress}</Text>}
        {company.city && <Text style={styles.line}>{company.city}</Text>}
        <Text style={styles.line}>Tél : {company.phone}</Text>
        {company.taxId && <Text style={styles.line}>NIU : {company.taxId}</Text>}
        {company.rccm && <Text style={styles.line}>RCCM : {company.rccm}</Text>}
      </View>
    </View>
  );
}
