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
import { resolveBrand } from '../brand';

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
  watermarkBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    paddingVertical: 3,
    textAlign: 'center',
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  watermarkDiagonal: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#94A3B8',
    opacity: 0.3,
    transform: 'rotate(-30deg)',
    letterSpacing: 2,
  },
  watermarkFooter: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 6,
    color: '#F59E0B',
    fontWeight: 'bold',
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
  const brand = resolveBrand(doc.company);

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
        <View style={[styles.header, { borderColor: brand.primary }]}>
          <CompanyHeader company={doc.company} compact locale={doc.locale} />
        </View>
        <Text style={[styles.docTitle, { color: brand.primary }]}>
          {isEn ? config.labelEn : config.label}
        </Text>
        <Text style={styles.docNumber}>
          N° {doc.number} · {formatDateShort(doc.createdAt, doc.locale)}
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
          primaryColor={brand.primary}
        />
        <Totals
          payload={doc.payload}
          compact
          currency={doc.company.currency}
          showVat={config.showVat}
          hidePrices={hidePrices}
          locale={doc.locale}
          primaryColor={brand.primary}
          accentColor={brand.accent}
        />
        {doc.company.showStampOnTicket && doc.company.stampUrl && (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Image src={doc.company.stampUrl} style={{ width: 70, height: 70, objectFit: 'contain' }} />
          </View>
        )}
        <Footer doc={doc} compact />
        {options.showWatermark && !doc.whiteLabel && (
          <>
            <Text style={styles.watermarkBanner} fixed>
              MYCASHBILL — {doc.locale === 'FR' ? 'VERSION GRATUITE' : 'FREE VERSION'}
            </Text>
            <Text style={styles.watermarkDiagonal} fixed>
              {doc.locale === 'FR' ? 'VERSION GRATUITE' : 'FREE VERSION'}
            </Text>
            <Text style={styles.watermarkFooter} fixed>
              {doc.locale === 'FR'
                ? 'Doc généré en version gratuite · Passez Pro : mycashbill.app'
                : 'Generated with free version · Upgrade: mycashbill.app'}
            </Text>
          </>
        )}
      </Page>
    </Document>
  );
}
