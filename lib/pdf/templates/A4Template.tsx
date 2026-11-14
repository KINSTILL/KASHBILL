import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import type { PdfDocument, PdfRenderOptions } from '../types';
import { CompanyHeader } from '../shared/CompanyHeader';
import { ClientBlock } from '../shared/ClientBlock';
import { DocumentMeta } from '../shared/DocumentMeta';
import { ItemsTable } from '../shared/ItemsTable';
import { Totals } from '../shared/Totals';
import { Footer } from '../shared/Footer';
import { formatDateShort } from '../shared/format';
import { resolveBrand, PDF_TOKENS } from '../brand';

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 36,
    paddingVertical: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, marginBottom: 16 },
  docTitle: { fontSize: 26, fontWeight: 'bold', letterSpacing: 0.5 },
  metaRight: { alignItems: 'flex-end' },
  docNumber: { fontSize: 11.5, fontWeight: 'bold', color: PDF_TOKENS.neutral.ink },
  docDate: { fontSize: 9.5, color: PDF_TOKENS.neutral.muted, marginTop: 2 },
  notes: { marginTop: 14, fontSize: 9.5, color: '#475569', fontStyle: 'italic' },
  signatureBlock: {
    marginTop: 30,
    borderTopWidth: 0.5,
    borderColor: '#CBD5E1',
    paddingTop: 8,
  },
  signatureLabel: { fontSize: 9, color: '#64748B' },
  sellerBlock: { marginTop: 18, alignItems: 'flex-end' },
  sellerLabel: { fontSize: 9, color: '#64748B', marginBottom: 4 },
  sellerImages: { flexDirection: 'row', alignItems: 'center' },
  sellerStamp: { width: 84, height: 84, objectFit: 'contain', marginRight: 8 },
  sellerSignature: { width: 120, height: 48, objectFit: 'contain' },
  signatureLine: {
    marginTop: 40,
    borderTopWidth: 0.5,
    borderColor: '#0F172A',
    width: 200,
  },
  watermarkBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  watermarkDiagonal: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 44,
    fontWeight: 'bold',
    color: '#94A3B8',
    opacity: 0.14,
    transform: 'rotate(-30deg)',
    letterSpacing: 3,
  },
  watermarkFooter: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    color: '#D97706',
    fontWeight: 'bold',
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
  const brand = resolveBrand(doc.company);
  const decimals: 0 | 1 | 2 =
    doc.decimalPlaces === 1 || doc.decimalPlaces === 2 ? doc.decimalPlaces : 0;

  const clientBlockLabel =
    doc.type === 'BORDEREAU'
      ? isEn
        ? 'Delivered to'
        : 'Livré à'
      : doc.type === 'RECU'
      ? isEn
        ? 'Received from'
        : 'Reçu de'
      : doc.type === 'FACTURE'
      ? isEn
        ? 'Billed to'
        : 'Facturé à'
      : 'Client';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CompanyHeader company={doc.company} compact={false} locale={doc.locale} />
        <View style={styles.titleRow}>
          <Text style={[styles.docTitle, { color: brand.primary }]}>
            {isEn ? config.labelEn : config.label}
          </Text>
          <View style={styles.metaRight}>
            <Text style={styles.docNumber}>N° {doc.number}</Text>
            <Text style={styles.docDate}>{formatDateShort(doc.createdAt, doc.locale)}</Text>
          </View>
        </View>

        {doc.client && (
          <ClientBlock
            client={doc.client}
            compact={false}
            label={clientBlockLabel}
            locale={doc.locale}
            primaryColor={brand.primary}
          />
        )}
        <DocumentMeta doc={doc} compact={false} decimals={decimals} />

        <ItemsTable
          lines={doc.payload.lines}
          compact={false}
          currency={doc.company.currency}
          showVat={config.showVat}
          hidePrices={hidePrices}
          locale={doc.locale}
          primaryColor={brand.primary}
          decimals={decimals}
        />
        <Totals
          payload={doc.payload}
          compact={false}
          currency={doc.company.currency}
          showVat={config.showVat}
          hidePrices={hidePrices}
          locale={doc.locale}
          primaryColor={brand.primary}
          accentColor={brand.accent}
          decimals={decimals}
        />
        {doc.payload.notes && (
          <Text style={styles.notes}>
            {isEn ? 'Note' : 'Note'} : {doc.payload.notes}
          </Text>
        )}
        {(doc.company.signatureUrl || doc.company.stampUrl) && (
          <View style={styles.sellerBlock} wrap={false}>
            <Text style={styles.sellerLabel}>
              {isEn ? 'For' : 'Pour'} {doc.company.businessName ?? doc.company.legalName ?? ''}
            </Text>
            <View style={styles.sellerImages}>
              {doc.company.stampUrl && <Image src={doc.company.stampUrl} style={styles.sellerStamp} />}
              {doc.company.signatureUrl && (
                <Image src={doc.company.signatureUrl} style={styles.sellerSignature} />
              )}
            </View>
          </View>
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
        {options.showWatermark && !doc.whiteLabel && (
          <>
            <Text style={styles.watermarkBanner} fixed>
              {doc.locale === 'FR'
                ? 'MODE GRATUIT · DOCUMENT GÉNÉRÉ PAR MYCASHBILL'
                : 'FREE MODE · DOCUMENT GENERATED BY MYCASHBILL'}
            </Text>
            <Text style={styles.watermarkDiagonal} fixed>
              {doc.locale === 'FR' ? 'MODE GRATUIT\nGÉNÉRÉ PAR MYCASHBILL' : 'FREE MODE\nGENERATED BY MYCASHBILL'}
            </Text>
            <Text style={styles.watermarkFooter} fixed>
              {doc.locale === 'FR'
                ? 'Mode gratuit · Document généré par MyCashBill · Passez Pro : mycashbill.app'
                : 'Free mode · Document generated by MyCashBill · Upgrade: mycashbill.app'}
            </Text>
          </>
        )}
      </Page>
    </Document>
  );
}
