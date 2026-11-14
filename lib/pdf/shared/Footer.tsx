/* eslint-disable jsx-a11y/alt-text */
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { PdfDocument } from '../types';
import { PaymentBadges } from './PaymentBadges';
import { PDF_TOKENS } from '../brand';

export function Footer({ doc, compact }: { doc: PdfDocument; compact: boolean }) {
  const styles = StyleSheet.create({
    block: { marginTop: compact ? 10 : 20, borderTopWidth: 0.5, borderColor: PDF_TOKENS.neutral.hairline, paddingTop: compact ? 6 : 8 },
    payment: { marginBottom: 4 },
    label: {
      fontSize: compact ? 6 : 8,
      color: PDF_TOKENS.neutral.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    qrWrap: {
      marginTop: 4,
      padding: 4,
      alignSelf: 'flex-start',
      backgroundColor: PDF_TOKENS.neutral.surface,
      borderRadius: PDF_TOKENS.radius.md,
      borderWidth: 0.5,
      borderColor: PDF_TOKENS.neutral.line,
    },
    qr: { width: compact ? 40 : 60, height: compact ? 40 : 60 },
    cgv: { fontSize: compact ? 6 : 7.5, color: PDF_TOKENS.neutral.muted, marginTop: 4 },
    small: { fontSize: compact ? 6 : 7.5, color: PDF_TOKENS.neutral.faint, marginTop: 2 },
  });

  const hidePrices = doc.type === 'BORDEREAU' && doc.payload.total === 0;
  const showPayment = Boolean(doc.payload.paymentMethod) && !hidePrices;

  return (
    <View style={styles.block}>
      {showPayment && (
        <View style={styles.payment}>
          <Text style={styles.label}>{doc.locale === 'EN' ? 'Accepted payment:' : 'Paiement accepté :'}</Text>
          <PaymentBadges
            compact={compact}
            method={(doc.payload.paymentMethod ?? null) as 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHECK' | null}
            operatorName={doc.payload.paymentOperator ?? null}
            operatorFreeText={doc.payload.paymentOperatorFreeText ?? null}
            locale={doc.locale}
          />
        </View>
      )}
      {doc.qrCodeDataUrl && (
        <>
          <Text style={styles.label}>{doc.locale === 'EN' ? 'Verify authenticity:' : "Vérifier l'authenticité :"}</Text>
          <View style={styles.qrWrap}>
          <Image src={doc.qrCodeDataUrl} style={styles.qr} />
          </View>
        </>
      )}
      {(doc.cgvText ?? doc.company.cgvText) && <Text style={styles.cgv}>{doc.cgvText ?? doc.company.cgvText}</Text>}
      {!doc.whiteLabel && (
        <Text style={styles.small}>
          {doc.locale === 'EN'
            ? 'Issued via MyCashBill — Document generated electronically. MyCashBill is a technical tool and cannot be held liable for commercial or tax disputes.'
            : 'Émis via MyCashBill — Document généré électroniquement. MyCashBill est un outil technique et ne saurait être tenu responsable des litiges commerciaux ou fiscaux.'}
        </Text>
      )}
    </View>
  );
}

