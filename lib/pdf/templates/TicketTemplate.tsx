import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
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

export function TicketDocument({
  doc,
  options,
}: {
  doc: PdfDocument;
  options: PdfRenderOptions;
}) {
  const config = DOC_TYPE_CONFIG[doc.type];
  const isEn = doc.locale === 'EN';
  const hidePrices = doc.type === 'BORDEREAU' && doc.payload.total === 0;

  return (
    <Document>
      <Page size={{ width: 226.77, height: 600 }} style={styles.page}>
        <View style={styles.header}>
          <CompanyHeader company={doc.company} compact locale={doc.locale} />
        </View>
        <Text style={styles.docTitle}>{isEn ? config.labelEn : config.label}</Text>
        <Text style={styles.docNumber}>
          N° {doc.number} · {formatDateShort(doc.createdAt)}
        </Text>
        {doc.client && (
          <View style={styles.clientBlock}>
            <Text style={styles.clientLabel}>
              {doc.type === 'BORDEREAU'
                ? isEn
                  ? 'Recipient'
                  : 'Destinataire'
                : doc.type === 'RECU'
                ? isEn
                  ? 'Payer'
                  : 'Payeur'
                : 'Client'}
            </Text>
            <Text style={styles.clientName}>{doc.client.name}</Text>
            {doc.client.phone && <Text style={{ fontSize: 8 }}>{doc.client.phone}</Text>}
          </View>
        )}
        <ItemsTable
          lines={doc.payload.lines}
          compact
          currency={doc.company.currency}
          showVat={config.showVat}
          hidePrices={hidePrices}
          locale={doc.locale}
        />
        <Totals
          payload={doc.payload}
          compact
          currency={doc.company.currency}
          showVat={config.showVat}
          hidePrices={hidePrices}
          locale={doc.locale}
        />
        <Footer doc={doc} compact />
        {options.showWatermark && (
          <Text style={styles.watermark} fixed>
            {isEn ? 'Created with MyCashBill' : 'Créé avec MyCashBill'}
            {doc.referralCode ? ` — mycashbill.app/r/${doc.referralCode}` : ''}
          </Text>
        )}
      </Page>
    </Document>
  );
}
