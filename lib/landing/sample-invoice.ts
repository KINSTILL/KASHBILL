import { computePayload } from '@/lib/documents/payload';
import type { PdfDocument, PdfPayload, PdfRenderOptions } from '@/lib/pdf/types';

/**
 * Facture d'exemple affichée sur la page vitrine (« Kmer Chic Boutique »).
 * Elle est rendue par le MÊME template et le MÊME calcul que les factures du SaaS
 * (A4Template + computePayload), afin que le visiteur voie un document réel.
 * Les identifiants fiscaux et la cliente sont fictifs.
 */
export function buildSampleInvoice(now: Date = new Date()): {
  doc: PdfDocument;
  options: PdfRenderOptions;
} {
  const computed = computePayload({
    lines: [
      { description: 'Robe wax sur mesure', quantity: 1, unitPrice: 45000 },
      { description: 'Ensemble pagne 2 pièces', quantity: 2, unitPrice: 18500 },
      { description: 'Sac en cuir artisanal', quantity: 1, unitPrice: 22000 },
      { description: 'Chemise homme en coton', quantity: 3, unitPrice: 9500 },
    ],
    vatRate: 19.25,
    depositPercentage: null,
    deliveryFee: 5000,
    notes: 'Merci pour votre commande chez Kmer Chic Boutique.',
    validityDays: null,
    dueDate: null,
    referenceNumber: null,
    paymentMethod: 'MOBILE_MONEY',
    paymentReference: 'KC-2026-0042',
    paymentOperator: null,
    paymentOperatorFreeText: 'MTN MoMo',
    equivalentCurrency: null,
    equivalentAmount: null,
    exchangeRate: null,
    exchangeRateNote: null,
    deliveryDate: null,
    deliveryAddress: 'Bonanjo, Douala',
  });

  const payload = computed as unknown as PdfPayload;

  const doc: PdfDocument = {
    id: 'sample-kmer-chic',
    number: 'FA-2026-0042',
    type: 'FACTURE',
    locale: 'FR',
    createdAt: now,
    payload,
    company: {
      businessName: 'Kmer Chic Boutique',
      legalName: 'Kmer Chic Boutique SARL',
      city: 'Douala',
      legalAddress: 'Bonanjo, Rue Joss, Douala',
      phone: '+237 690 00 00 00',
      taxId: 'M000000000000A',
      rccm: 'RC/DLA/2024/B/0000',
      logoUrl: null,
      signatureUrl: null,
      stampUrl: null,
      headerText: null,
      footerText: 'Merci de votre confiance',
      cgvText:
        'Paiement à réception. Marchandises vendues ne sont ni reprises ni échangées après découpe ou retouche.',
      legalForm: 'SARL',
      country: 'CM',
      currency: 'XAF',
      brand: null,
    },
    client: {
      name: 'Mme Solange Ndongo',
      phone: '+237 677 00 00 00',
      email: null,
      address: 'Akwa, Douala',
      taxId: null,
    },
    qrCodeDataUrl: null,
    publicToken: null,
    watermarked: false,
    referralCode: null,
    cgvText: null,
    whiteLabel: false,
  };

  const options: PdfRenderOptions = {
    format: 'a4',
    showLogo: true,
    showSignature: true,
    showStamp: true,
    showCgv: true,
    showWatermark: false,
    whiteLabel: false,
  };

  return { doc, options };
}
