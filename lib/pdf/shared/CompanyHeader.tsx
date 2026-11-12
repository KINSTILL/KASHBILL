/* eslint-disable jsx-a11y/alt-text */
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Locale } from '@prisma/client';
import type { PdfCompany } from '../types';
import { resolveBrand, PDF_TOKENS } from '../brand';

export function CompanyHeader({
  company,
  compact,
  locale = 'FR',
}: {
  company: PdfCompany;
  compact: boolean;
  locale?: Locale;
}) {
  const isEn = locale === 'EN';
  const brand = resolveBrand(company);
  const styles = StyleSheet.create({
    // Barre de couleur d'en-tête (inspiration marketing), pleine largeur
    bar: {
      height: compact ? 3 : 5,
      backgroundColor: brand.primary,
      borderRadius: PDF_TOKENS.radius.sm,
      marginBottom: compact ? 6 : 10,
    },
    row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: compact ? 6 : 12 },
    logo: { width: compact ? 40 : 60, height: compact ? 40 : 60, objectFit: 'contain', marginRight: 10 },
    info: { flex: 1 },
    name: { fontSize: compact ? 12 : 16, fontWeight: 'bold', color: brand.primary },
    line: { fontSize: compact ? 7 : 9, color: PDF_TOKENS.neutral.subdued, marginTop: 1 },
    legalForm: { fontSize: compact ? 7 : 9, color: PDF_TOKENS.neutral.muted, fontStyle: 'italic', marginTop: 1 },
  });

  return (
    <View>
      <View style={styles.bar} />
      <View style={styles.row}>
        {company.logoUrl && <Image src={company.logoUrl} style={styles.logo} />}
        <View style={styles.info}>
          <Text style={styles.name}>
            {company.businessName ?? company.legalName ?? (isEn ? 'My Business' : 'Mon entreprise')}
          </Text>
          {company.legalForm && <Text style={styles.legalForm}>{company.legalForm}</Text>}
          {company.legalAddress && <Text style={styles.line}>{company.legalAddress}</Text>}
          {company.city && <Text style={styles.line}>{company.city}</Text>}
          <Text style={styles.line}>{isEn ? 'Phone' : 'Tél'} : {company.phone}</Text>
          {company.taxId && <Text style={styles.line}>{isEn ? 'Tax ID (NIU)' : 'NIU'} : {company.taxId}</Text>}
          {company.rccm && <Text style={styles.line}>RCCM : {company.rccm}</Text>}
        </View>
      </View>
    </View>
  );
}
