import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import type { PdfDocument, PdfRenderOptions } from '../types';
import { CompanyHeader } from '../shared/CompanyHeader';
import { ClientBlock } from '../shared/ClientBlock';
import { DocumentMeta } from '../shared/DocumentMeta';
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

  const clientLabel =
    doc.type === 'BORDEREAU'
      ? isEn
        ? 'Recipient'
        : 'Destinataire'
      : doc.type === 'RECU'
      ? isEn
        ? 'Payer'
        : 'Payeur'
      : isEn
      ? 'Client'
      : 'Client';

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
          <ClientBlock
            client={doc.client}
            compact
            label={clientLabel}
            locale={doc.locale}
          />
        )}
        <DocumentMeta doc={doc} compact />
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
