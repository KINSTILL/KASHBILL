/* eslint-disable jsx-a11y/alt-text */
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { SubscriptionInvoicePdfInput } from './types';

const BRASS = '#B8935A';
const BRASS_LIGHT = '#D4B584';
const INK = '#0B1220';
const SLATE = '#475569';
const BORDER = '#E2E8F0';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: INK, backgroundColor: '#FFFFFF' },
  headerBar: { height: 4, backgroundColor: BRASS, marginBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  logo: { width: 80, height: 40, objectFit: 'contain', marginRight: 16 },
  brandBlock: { flex: 1 },
  brandName: { fontSize: 22, fontWeight: 'bold', letterSpacing: -0.3 },
  brandTagline: { fontSize: 9, color: SLATE, marginTop: 2 },
  titleBlock: { marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  number: { fontSize: 10, color: SLATE, fontFamily: 'Courier' },
  proBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: BRASS_LIGHT, color: '#FFFFFF',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3,
    fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5,
  },
  warningBanner: {
    marginBottom: 16, padding: 8, backgroundColor: '#FEF3C7',
    borderLeftWidth: 3, borderLeftColor: '#F59E0B', borderRadius: 3,
  },
  warningText: { fontSize: 8, color: '#92400E' },
  grid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  box: { flex: 1, padding: 12, backgroundColor: '#FAFBFC', borderRadius: 6, borderWidth: 0.5, borderColor: BORDER },
  boxLabel: { fontSize: 7, color: SLATE, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  boxTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  boxLine: { fontSize: 9, color: SLATE, marginTop: 1 },
  table: { marginTop: 12, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 6, marginBottom: 8 },
  th: { fontSize: 9, fontWeight: 'bold' },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: BORDER },
  td: { fontSize: 10 },
  colDesc: { flex: 3 },
  colPeriod: { flex: 2, textAlign: 'center', fontSize: 8, color: SLATE },
  colAmount: { flex: 1, textAlign: 'right' },
  totals: { alignItems: 'flex-end', marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { fontSize: 10, color: SLATE, marginRight: 12 },
  totalValue: { fontSize: 10, textAlign: 'right', minWidth: 100 },
  grandTotalRow: {
    flexDirection: 'row', justifyContent: 'flex-end',
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1.5, borderTopColor: BRASS,
  },
  grandTotalLabel: { fontSize: 13, fontWeight: 'bold', marginRight: 12, color: INK },
  grandTotalValue: { fontSize: 16, fontWeight: 'bold', color: BRASS, textAlign: 'right', minWidth: 120 },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  paidStamp: {
    alignSelf: 'flex-start',
    borderWidth: 2, borderColor: BRASS,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4,
    transform: 'rotate(-3deg)',
  },
  paidText: { fontSize: 14, fontWeight: 'bold', color: BRASS, letterSpacing: 2 },
  qrContainer: {
    alignItems: 'center',
    padding: 6,
    backgroundColor: '#FAFBFC',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  qrCode: {
    width: 60,
    height: 60,
  },
  qrLabel: {
    fontSize: 7,
    color: SLATE,
    marginTop: 4,
    fontWeight: 'bold',
  },
  qrSub: {
    fontSize: 6,
    color: SLATE,
    marginTop: 1,
  },
  vatNote: { fontSize: 8, color: SLATE, marginTop: 8, fontStyle: 'italic' },
  footer: { marginTop: 30, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: BORDER },
  footerText: { fontSize: 7, color: SLATE, textAlign: 'center', marginBottom: 3 },
  footerStrong: { fontSize: 8, color: INK, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
});

export function SubscriptionInvoiceDocument({ input }: { input: SubscriptionInvoicePdfInput }) {
  const {
    user,
    company,
    amount,
    vatRate,
    vatAmount,
    total,
    paidAt,
    number,
    subscription,
    publicToken,
    qrCode,
  } = input;
  const isFr = user.locale === 'FR';

  const fmt = (n: number) =>
    `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n).replace(/\s/g, '\u00A0')}\u00A0FCFA`;

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(isFr ? 'fr-FR' : 'en-GB', {
      timeZone: 'Africa/Douala', day: '2-digit', month: 'long', year: 'numeric',
    }).format(d);

  const vatMention = company.vatRegistered
    ? `TVA ${company.vatRate}%`
    : isFr ? 'TVA non applicable — Article 275 du CGI' : 'VAT not applicable — Article 275 CGI';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar} />

        <View style={styles.headerRow}>
          {company.logoUrl ? <Image src={company.logoUrl} style={styles.logo} /> : null}
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>MyCashBill</Text>
            <Text style={styles.brandTagline}>
              {isFr ? "Facturation professionnelle pour l'Afrique" : 'Professional invoicing for Africa'}
            </Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{isFr ? "FACTURE D'ABONNEMENT" : 'SUBSCRIPTION INVOICE'}</Text>
          <Text style={styles.number}>N° {number}</Text>
          <View style={styles.proBadge}><Text>PRO</Text></View>
        </View>

        {!company.isFullyConfigured && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              {isFr
                ? 'Document de démonstration — les informations légales de la plateforme ne sont pas encore complétées.'
                : 'Demo document — platform legal information is not yet complete.'}
            </Text>
          </View>
        )}

        <View style={styles.grid}>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>{isFr ? 'Émetteur' : 'Issuer'}</Text>
            <Text style={styles.boxTitle}>{company.legalName}</Text>
            <Text style={styles.boxLine}>{company.address}</Text>
            <Text style={styles.boxLine}>{company.city}, {company.country}</Text>
            <Text style={styles.boxLine}>{isFr ? 'NIU' : 'Tax ID'} : {company.taxId}</Text>
            <Text style={styles.boxLine}>RCCM : {company.rccm}</Text>
            <Text style={styles.boxLine}>{company.phone}</Text>
            <Text style={styles.boxLine}>{company.email}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>{isFr ? 'Client' : 'Client'}</Text>
            <Text style={styles.boxTitle}>{user.name ?? user.businessName ?? user.phone}</Text>
            {user.businessName && user.name && <Text style={styles.boxLine}>{user.businessName}</Text>}
            <Text style={styles.boxLine}>{user.phone}</Text>
            {user.email && <Text style={styles.boxLine}>{user.email}</Text>}
            {user.city && <Text style={styles.boxLine}>{user.city}</Text>}
            {user.taxId && <Text style={styles.boxLine}>{isFr ? 'NIU' : 'Tax ID'} : {user.taxId}</Text>}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 9, color: SLATE }}>
            {isFr ? 'Date de paiement' : 'Payment date'} : {fmtDate(paidAt)}
          </Text>
          <Text style={{ fontSize: 9, color: SLATE }}>
            {isFr ? 'Mode' : 'Method'} : Notch Pay (Mobile Money)
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>{isFr ? 'Désignation' : 'Description'}</Text>
            <Text style={[styles.th, styles.colPeriod]}>{isFr ? 'Période' : 'Period'}</Text>
            <Text style={[styles.th, styles.colAmount]}>{isFr ? 'Montant' : 'Amount'}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.colDesc}>
              <Text style={styles.td}>MyCashBill Pro</Text>
              <Text style={{ fontSize: 8, color: SLATE, marginTop: 2 }}>
                {isFr ? 'Abonnement mensuel — toutes fonctionnalités' : 'Monthly subscription — all features'}
              </Text>
            </View>
            <Text style={[styles.td, styles.colPeriod]}>
              {fmtDate(subscription.startsAt)} → {fmtDate(subscription.endsAt)}
            </Text>
            <Text style={[styles.td, styles.colAmount]}>{fmt(amount)}</Text>
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{isFr ? 'Sous-total' : 'Subtotal'}</Text>
            <Text style={styles.totalValue}>{fmt(amount)}</Text>
          </View>
          {vatAmount !== null && vatRate !== null && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA ({vatRate}%)</Text>
              <Text style={styles.totalValue}>{fmt(vatAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
          </View>
          <Text style={styles.vatNote}>{vatMention}</Text>
        </View>

        <View style={styles.paidRow}>
          <View>
            <View style={styles.paidStamp}>
              <Text style={styles.paidText}>{isFr ? 'PAYÉ' : 'PAID'}</Text>
            </View>
            {subscription.providerRef && (
              <Text style={{ fontSize: 8, color: SLATE, marginTop: 10 }}>
                {isFr ? 'Référence de paiement' : 'Payment reference'} : {subscription.providerRef}
              </Text>
            )}
          </View>
          {qrCode && (
            <View style={styles.qrContainer}>
              <Image src={qrCode} style={styles.qrCode} />
              <Text style={styles.qrLabel}>
                {isFr ? 'Vérifier l’authenticité' : 'Verify authenticity'}
              </Text>
              <Text style={styles.qrSub}>
                /verify/{publicToken ?? number}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerStrong}>{company.legalName}</Text>
          <Text style={styles.footerText}>
            {company.address}, {company.city}, {company.country} · {company.phone} · {company.email}
          </Text>
          <Text style={styles.footerText}>
            NIU : {company.taxId} · RCCM : {company.rccm} · {company.web}
          </Text>
          <Text style={[styles.footerText, { marginTop: 8 }]}>
            {isFr
              ? "Document émis électroniquement par MyCashBill. Facture d'abonnement — ne constitue pas une facture de vente de biens ou services à un tiers."
              : 'Electronically issued by MyCashBill. Subscription invoice — does not constitute a sale invoice to a third party.'}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
