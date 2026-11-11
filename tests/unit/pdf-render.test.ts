import { describe, it, expect } from 'vitest';
import { pdf } from '@react-pdf/renderer';
import { A4Document } from '@/lib/pdf/templates/A4Template';
import { TicketDocument } from '@/lib/pdf/templates/TicketTemplate';

// Rendu serveur (même chemin que lib/pdf/render-document.ts), sans passer par le navigateur
async function renderPdfToBlob(doc: any, format: 'a4' | 'ticket', options: any): Promise<Blob> {
  const element = format === 'ticket' ? TicketDocument({ doc, options }) : A4Document({ doc, options });
  return pdf(element as any).toBlob();
}

describe('renderPdfToBlob (serveur)', () => {
  it('renders A4 and Ticket PDFs without error', async () => {
    const doc: any = {
      id: '1',
      number: 'FAC-2026-0001',
      type: 'FACTURE',
      locale: 'FR',
      createdAt: new Date(),
      payload: {
        lines: [{ description: 'Test article', quantity: 2, unitPrice: 5000, total: 10000 }],
        subtotal: 10000,
        vatRate: 19.25,
        vatAmount: 1925,
        deliveryFee: 1000,
        depositAmount: 2000,
        total: 10925,
        notes: 'Merci pour votre confiance',
        paymentMethod: 'MOBILE_MONEY',
        paymentOperator: 'MTN MoMo',
      },
      company: {
        businessName: 'Boutique Test',
        legalName: 'Boutique Test SARL',
        city: 'Douala',
        legalAddress: 'Akwa',
        phone: '+237600000000',
        taxId: 'M0123456789',
        rccm: 'RC/DLA/2026/B/123',
        logoUrl: null,
        signatureUrl: null,
        stampUrl: null,
        headerText: null,
        footerText: null,
        cgvText: 'Conditions générales',
        legalForm: 'SARL',
        country: 'CM',
        currency: 'XAF',
        brand: null,
      },
      client: { name: 'Jean Dupont', phone: '+237699000000', email: null, address: 'Bonapriso', taxId: null },
      qrCodeDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      publicToken: 'tok123',
      watermarked: true,
      referralCode: 'REF123',
      cgvText: 'Conditions générales',
      whiteLabel: false,
    };

    const a4 = await renderPdfToBlob(doc, 'a4', {
      format: 'a4',
      showLogo: true,
      showSignature: true,
      showStamp: true,
      showCgv: true,
      showWatermark: true,
      whiteLabel: false,
    });
    expect(a4.size).toBeGreaterThan(500);

    const ticket = await renderPdfToBlob(doc, 'ticket', {
      format: 'ticket',
      showLogo: true,
      showSignature: true,
      showStamp: true,
      showCgv: true,
      showWatermark: true,
      whiteLabel: false,
    });
    expect(ticket.size).toBeGreaterThan(500);
  });
});
