import { describe, it, expect } from 'vitest';
import { buildDocumentXml, escapeXml } from '@/lib/einvoice/ubl';
import type { PdfDocument } from '@/lib/pdf/types';

const doc = {
  number: 'FA-2026-0042',
  type: 'FACTURE',
  locale: 'FR',
  createdAt: new Date('2026-11-10T10:00:00Z'),
  payload: {
    lines: [{ description: 'Robe & Wax <M>', quantity: 2, unitPrice: 45000, total: 90000 }],
    subtotal: 90000,
    vatRate: 19.25,
    vatAmount: 17325,
    depositAmount: null,
    deliveryFee: 5000,
    total: 112325,
    notes: null,
  },
  company: {
    businessName: 'Kmer Chic',
    legalName: null,
    city: 'Douala',
    legalAddress: 'Akwa',
    phone: '+237600000000',
    taxId: 'M0123',
    rccm: null,
    country: 'CM',
    currency: 'XAF',
  },
  client: { name: 'Estelle', phone: null, address: null },
} as unknown as PdfDocument;

describe('buildDocumentXml', () => {
  const xml = buildDocumentXml(doc);

  it('contient les montants et le numéro', () => {
    expect(xml).toContain('<cbc:ID>FA-2026-0042</cbc:ID>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="XAF">112325</cbc:PayableAmount>');
    expect(xml).toContain('<cbc:TaxAmount currencyID="XAF">17325</cbc:TaxAmount>');
    expect(xml).toContain('<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>');
  });

  it('échappe les caractères spéciaux', () => {
    expect(xml).toContain('Robe &amp; Wax &lt;M&gt;');
    expect(escapeXml('a"b\'c')).toBe('a&quot;b&apos;c');
  });

  it('code proforma = 325', () => {
    expect(buildDocumentXml({ ...doc, type: 'PROFORMA' })).toContain('>325<');
  });
});
