import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PdfDocument, PdfRenderOptions } from '../types';
import { CompanyHeader } from '../shared/CompanyHeader';
import { ItemsTable } from '../shared/ItemsTable';
import { Totals } from '../shared/Totals';
import { Footer } from '../shared/Footer';
import { formatDateShort } from '../shared/format';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  docTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 8, marginBottom: 2 },
  docNumber: { fontSize: 10, color: '#64748B', marginBottom: 20 },
  clientBlock: { marginBottom: 20, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 4 },
  clientLabel: { fontSize: 8, color: '#64748B', marginBottom: 2 },
  clientName: { fontSize: 11, fontWeight: 'bold' },
  clientLine: { fontSize: 9, color: '#475569' },
  notes: { marginTop: 12, fontSize: 9, color: '#475569', fontStyle: 'italic' },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 40,
    color: '#94A3B8',
    opacity: 0.15,
    transform: 'rotate(-30deg)',
  },
});

const DOC_LABELS: Record<string, string> = {
  TICKET: 'TICKET',
  RECU: 'REÇU',
  DEVIS: 'DEVIS',
  PROFORMA: 'FACTURE PROFORMA',
  FACTURE: 'FACTURE',
  BON_COMMANDE: 'BON DE COMMANDE',
  BORDEREAU: 'BORDEREAU DE LIVRAISON',
};

export function A4Document({
  doc,
  options,
}: {
  doc: PdfDocument;
  options: PdfRenderOptions;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CompanyHeader company={doc.company} compact={false} />
        <Text style={styles.docTitle}>{DOC_LABELS[doc.type] ?? doc.type}</Text>
        <Text style={styles.docNumber}>
          N° {doc.number} · {formatDateShort(doc.createdAt)}
        </Text>
        {doc.client && (
          <View style={styles.clientBlock}>
            <Text style={styles.clientLabel}>Facturé à</Text>
            <Text style={styles.clientName}>{doc.client.name}</Text>
            {doc.client.address && <Text style={styles.clientLine}>{doc.client.address}</Text>}
            {doc.client.phone && <Text style={styles.clientLine}>{doc.client.phone}</Text>}
          </View>
        )}
        <ItemsTable lines={doc.payload.lines} compact={false} currency={doc.company.currency} />
        <Totals payload={doc.payload} compact={false} currency={doc.company.currency} />
        {doc.payload.notes && <Text style={styles.notes}>Note : {doc.payload.notes}</Text>}
        <Footer doc={doc} compact={false} />
        {options.showWatermark && (
          <Text style={styles.watermark} fixed>
            {doc.locale === 'EN' ? 'Created with MyCashBill' : 'Créé avec MyCashBill'}
            {doc.referralCode ? `\n\nmycashbill.app/r/${doc.referralCode}` : ''}
          </Text>
        )}
      </Page>
    </Document>
  );
}
