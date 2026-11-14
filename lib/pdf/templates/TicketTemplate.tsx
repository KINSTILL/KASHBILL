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

const TICKET_WIDTH = 226.77; // 80 mm

/**
 * Hauteur du ticket : react-pdf n'a pas de hauteur automatique, une hauteur fixe coupait le
 * contenu long sur une 2e page. Estimation volontairement généreuse (un peu de blanc en bas
 * vaut mieux qu'une page orpheline), bornée en bas pour les tickets très courts.
 */
function estimateTicketHeight(doc: PdfDocument, showStamp: boolean): number {
  const wrapLines = (text: string | null | undefined, charsPerLine: number) =>
    text ? Math.ceil(text.length / charsPerLine) : 0;
  const c = doc.company;
  const company =
    100 +
    wrapLines(c.businessName ?? c.legalName ?? '', 24) * 16 +
    wrapLines(c.legalAddress, 44) * 11 +
    wrapLines(c.legalForm, 44) * 11;
  const client = doc.client
    ? 55 + wrapLines(doc.client.name, 26) * 15 + wrapLines(doc.client.address, 44) * 11
    : 0;
  const items = doc.payload.lines.reduce(
    (acc, l) => acc + Math.max(1, wrapLines(l.description, 40)) * 11 + 18,
    0
  );
  const footer =
    60 +
    (doc.qrCodeDataUrl ? 80 : 0) +
    wrapLines(doc.cgvText ?? c.cgvText, 60) * 8 +
    (doc.whiteLabel ? 0 : 50);
  const stamp = showStamp ? 90 : 0;
  return Math.max(380, Math.ceil(company + 55 + client + 50 + 20 + items + 140 + footer + stamp + 40));
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 14,
    paddingVertical: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  header: { borderBottomWidth: 1, borderColor: PDF_TOKENS.neutral.ink, paddingBottom: 4, marginBottom: 6 },
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
    fontSize: 8,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#94A3B8',
    opacity: 0.14,
    transform: 'rotate(-30deg)',
    letterSpacing: 2,
  },
  watermarkFooter: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
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
  const decimals: 0 | 1 | 2 =
    doc.decimalPlaces === 1 || doc.decimalPlaces === 2 ? doc.decimalPlaces : 0;

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
      <Page
        size={{
          width: TICKET_WIDTH,
          height: estimateTicketHeight(doc, Boolean(doc.company.showStampOnTicket && doc.company.stampUrl)),
        }}
        style={styles.page}
      >
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
            primaryColor={brand.primary}
          />
        )}
        <DocumentMeta doc={doc} compact decimals={decimals} />
        <ItemsTable
          lines={doc.payload.lines}
          compact
          currency={doc.company.currency}
          showVat={config.showVat}
          hidePrices={hidePrices}
          locale={doc.locale}
          primaryColor={brand.primary}
          decimals={decimals}
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
          decimals={decimals}
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
              {doc.locale === 'FR' ? 'MODE GRATUIT · GÉNÉRÉ PAR MYCASHBILL' : 'FREE MODE · BY MYCASHBILL'}
            </Text>
            <Text style={styles.watermarkDiagonal} fixed>
              {doc.locale === 'FR' ? 'MODE GRATUIT\nPAR MYCASHBILL' : 'FREE MODE\nBY MYCASHBILL'}
            </Text>
            <Text style={styles.watermarkFooter} fixed>
              {doc.locale === 'FR'
                ? 'Mode gratuit · Document généré par MyCashBill · mycashbill.app'
                : 'Free mode · Document generated by MyCashBill · mycashbill.app'}
            </Text>
          </>
        )}
      </Page>
    </Document>
  );
}
