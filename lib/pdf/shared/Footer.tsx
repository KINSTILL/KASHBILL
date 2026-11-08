/* eslint-disable jsx-a11y/alt-text */
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { PdfDocument } from '../types';
import { PaymentBadges } from './PaymentBadges';

export function Footer({ doc, compact }: { doc: PdfDocument; compact: boolean }) {
  const styles = StyleSheet.create({
    block: { marginTop: compact ? 10 : 20, borderTopWidth: 0.5, borderColor: '#CBD5E1', paddingTop: 6 },
    payment: { marginBottom: 4 },
    label: { fontSize: compact ? 6 : 8, color: '#64748B' },
    small: { fontSize: compact ? 5 : 7, color: '#94A3B8', marginTop: 2 },
    qr: { width: compact ? 40 : 60, height: compact ? 40 : 60, marginTop: 4 },
    cgv: { fontSize: compact ? 5 : 7, color: '#64748B', marginTop: 4 },
  });

  return (
    <View style={styles.block}>
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
      {doc.qrCodeDataUrl && (
        <>
          <Text style={styles.label}>{doc.locale === 'EN' ? 'Verify authenticity:' : "Vérifier l'authenticité :"}</Text>
          <Image src={doc.qrCodeDataUrl} style={styles.qr} />
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
