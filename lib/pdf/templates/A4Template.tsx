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
        {config.showValidity && doc.payload.validityDays ? (
          <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>
            {isEn
              ? `Valid for ${doc.payload.validityDays} days`
              : `Valable ${doc.payload.validityDays} jours`}
          </Text>
        ) : null}
        <Text style={styles.docNumber}>
          N° {doc.number} · {formatDateShort(doc.createdAt)}
        </Text>
        {doc.client && (
          <View style={styles.clientBlock}>
            <Text style={styles.clientLabel}>{clientBlockLabel}</Text>
            <Text style={styles.clientName}>{doc.client.name}</Text>
            {doc.client.address && <Text style={styles.clientLine}>{doc.client.address}</Text>}
            {doc.client.phone && <Text style={styles.clientLine}>{doc.client.phone}</Text>}
          </View>
        )}
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
        {config.showRecipientSignature ? (
          <View style={{ marginTop: 30, borderTopWidth: 0.5, borderColor: '#CBD5E1', paddingTop: 8 }}>
            <Text style={{ fontSize: 9, color: '#64748B' }}>
              {isEn ? 'Recipient signature and stamp' : 'Signature et cachet du destinataire'}
            </Text>
            <View style={{ marginTop: 40, borderTopWidth: 0.5, borderColor: '#0F172A', width: 200 }} />
          </View>
        ) : null}
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
