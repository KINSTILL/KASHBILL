import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { PdfDocument, PdfRenderOptions } from '../types';
import { CompanyHeader } from '../shared/CompanyHeader';
import { ItemsTable } from '../shared/ItemsTable';
import { Totals } from '../shared/Totals';
import { Footer } from '../shared/Footer';
import { formatDateShort } from '../shared/format';

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 14,
    paddingVertical: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  header: { borderBottomWidth: 1, borderColor: '#0F172A', paddingBottom: 4, marginBottom: 6 },
  docTitle: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  docNumber: { fontSize: 8, textAlign: 'center', color: '#64748B', marginBottom: 4 },
  clientBlock: { marginBottom: 6 },
  clientLabel: { fontSize: 7, color: '#64748B' },
  clientName: { fontSize: 10, fontWeight: 'bold' },
  watermark: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    color: '#94A3B8',
    opacity: 0.15,
    transform: 'rotate(-30deg)',
  },
});

const DOC_LABELS: Record<string, string> = {
  TICKET: 'TICKET',
  RECU: 'REÇU',
  DEVIS: 'DEVIS',
  PROFORMA: 'PROFORMA',
  FACTURE: 'FACTURE',
  BON_COMMANDE: 'BON DE COMMANDE',
  BORDEREAU: 'BORDEREAU',
};

export function TicketDocument({
  doc,
  options,
}: {
  doc: PdfDocument;
  options: PdfRenderOptions;
}) {
  return (
    <Document>
      <Page size={{ width: 226.77, height: 600 }} style={styles.page}>
        <View style={styles.header}>
          <CompanyHeader company={doc.company} compact />
        </View>
        <Text style={styles.docTitle}>{DOC_LABELS[doc.type] ?? doc.type}</Text>
        <Text style={styles.docNumber}>
          N° {doc.number} · {formatDateShort(doc.createdAt)}
        </Text>
        {doc.client && (
          <View style={styles.clientBlock}>
            <Text style={styles.clientLabel}>Client</Text>
            <Text style={styles.clientName}>{doc.client.name}</Text>
            {doc.client.phone && <Text style={{ fontSize: 8 }}>{doc.client.phone}</Text>}
          </View>
        )}
        <ItemsTable lines={doc.payload.lines} compact currency={doc.company.currency} />
        <Totals payload={doc.payload} compact currency={doc.company.currency} />
        <Footer doc={doc} compact />
        {options.showWatermark && (
          <Text style={styles.watermark} fixed>
            Créé avec CashBill{doc.referralCode ? ` — cashbill.cm/r/${doc.referralCode}` : ''}
          </Text>
        )}
      </Page>
    </Document>
  );
}

