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
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  docTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 8, marginBottom: 2 },
  docNumber: { fontSize: 10, color: '#64748B', marginBottom: 20 },
  notes: { marginTop: 12, fontSize: 9, color: '#475569', fontStyle: 'italic' },
  signatureBlock: {
    marginTop: 30,
    borderTopWidth: 0.5,
    borderColor: '#CBD5E1',
    paddingTop: 8,
  },
  signatureLabel: { fontSize: 9, color: '#64748B' },
  signatureLine: {
    marginTop: 40,
    borderTopWidth: 0.5,
    borderColor: '#0F172A',
    width: 200,
  },
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

export function A4Document({
  doc,
  options,
}: {
  doc: PdfDocument;
  options: PdfRenderOptions;
}) {
  const config = DOC_TYPE_CONFIG[doc.type];
  const isEn = doc.locale === 'EN';
  const hidePrices = doc.type === 'BORDEREAU' && doc.payload.total === 0;

  const clientBlockLabel =
    doc.type === 'BORDEREAU'
      ? isEn
        ? 'Delivered to'
        : 'Livré à'
      : doc.type === 'RECU'
      ? isEn
        ? 'Received from'
        : 'Reçu de'
      : isEn
      ? 'Billed to'
      : 'Facturé à';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CompanyHeader company={doc.company} compact={false} locale={doc.locale} />
        <Text style={styles.docTitle}>{isEn ? config.labelEn : config.label}</Text>
        <Text style={styles.docNumber}>
          N° {doc.number} · {formatDateShort(doc.createdAt)}
        </Text>

        {doc.client && (
          <ClientBlock
            client={doc.client}
            compact={false}
            label={clientBlockLabel}
            locale={doc.locale}
          />
        )}
        <DocumentMeta doc={doc} compact={false} />

        <ItemsTable
          lines={doc.payload.lines}
          compact={false}
          currency={doc.company.currency}
          showVat={config.showVat}
          hidePrices={hidePrices}
          locale={doc.locale}
        />
        <Totals
          payload={doc.payload}
          compact={false}
          currency={doc.company.currency}
          showVat={config.showVat}
          hidePrices={hidePrices}
          locale={doc.locale}
        />
        {doc.payload.notes && (
          <Text style={styles.notes}>
            {isEn ? 'Note' : 'Note'} : {doc.payload.notes}
          </Text>
        )}
        {config.showRecipientSignature && (
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>
              {isEn ? 'Recipient signature and stamp' : 'Signature et cachet du destinataire'}
            </Text>
            <View style={styles.signatureLine} />
          </View>
        )}
        <Footer doc={doc} compact={false} />
        {options.showWatermark && (
          <Text style={styles.watermark} fixed>
            {isEn ? 'Created with MyCashBill' : 'Créé avec MyCashBill'}
            {doc.referralCode ? `\n\nmycashbill.app/r/${doc.referralCode}` : ''}
          </Text>
        )}
      </Page>
    </Document>
  );
}
