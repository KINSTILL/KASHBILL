import type { PdfDocument } from '@/lib/pdf/types';

const NS = {
  inv: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
  cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
};

// Code UNTDID 1001 : 380 = facture commerciale, 325 = proforma.
// Les autres types (devis, reçu, bon de commande, bordereau, ticket) réutilisent la structure
// « Invoice » ; leur nature exacte est portée par ProfileID et Note.
const TYPE_CODE: Record<string, string> = { PROFORMA: '325' };

export function escapeXml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function amount(n: number | null | undefined, decimals: number): string {
  return (Number.isFinite(n as number) ? (n as number) : 0).toFixed(decimals);
}

function isoDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

/** Génère le fichier XML structuré (UBL 2.1) d'un document, lisible par les logiciels. */
export function buildDocumentXml(doc: PdfDocument): string {
  const dec = doc.decimalPlaces === 1 || doc.decimalPlaces === 2 ? doc.decimalPlaces : 0;
  const cur = doc.company.currency;
  const p = doc.payload;
  const x = escapeXml;
  const money = (n: number | null | undefined) => amount(n, dec);

  const delivery = p.deliveryFee && p.deliveryFee > 0 ? p.deliveryFee : 0;
  const htBase = p.subtotal + delivery;
  const vat = p.vatRate !== null && p.vatAmount !== null ? p.vatAmount : null;
  const sellerName = doc.company.businessName ?? doc.company.legalName ?? doc.company.phone;

  const lines = p.lines
    .map(
      (l, i) => `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${l.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${x(cur)}">${money(l.total)}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Description>${x(l.description)}</cbc:Description><cbc:Name>${x(l.description.slice(0, 100))}</cbc:Name></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="${x(cur)}">${money(l.unitPrice)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`
    )
    .join('\n');

  const notes = [`MyCashBill:${doc.type}`, p.notes, p.referenceNumber ? `Ref: ${p.referenceNumber}` : null]
    .filter(Boolean)
    .map((n) => `  <cbc:Note>${x(String(n))}</cbc:Note>`)
    .join('\n');

  const buyer = doc.client
    ? `  <cac:AccountingCustomerParty><cac:Party>
    <cac:PartyName><cbc:Name>${x(doc.client.name)}</cbc:Name></cac:PartyName>${
      doc.client.address
        ? `\n    <cac:PostalAddress><cbc:StreetName>${x(doc.client.address)}</cbc:StreetName></cac:PostalAddress>`
        : ''
    }${
      doc.client.taxId
        ? `\n    <cac:PartyTaxScheme><cbc:CompanyID>${x(doc.client.taxId)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`
        : ''
    }${
      doc.client.phone || doc.client.email
        ? `\n    <cac:Contact>${doc.client.phone ? `<cbc:Telephone>${x(doc.client.phone)}</cbc:Telephone>` : ''}${doc.client.email ? `<cbc:ElectronicMail>${x(doc.client.email)}</cbc:ElectronicMail>` : ''}</cac:Contact>`
        : ''
    }
  </cac:Party></cac:AccountingCustomerParty>`
    : '';

  const tax =
    vat !== null
      ? `  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${x(cur)}">${money(vat)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${x(cur)}">${money(htBase)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${x(cur)}">${money(vat)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${p.vatRate}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>`
      : '';

  const charge =
    delivery > 0
      ? `  <cac:AllowanceCharge><cbc:ChargeIndicator>true</cbc:ChargeIndicator><cbc:AllowanceChargeReason>Delivery</cbc:AllowanceChargeReason><cbc:Amount currencyID="${x(cur)}">${money(delivery)}</cbc:Amount></cac:AllowanceCharge>`
      : '';

  const due = p.dueDate ? isoDate(p.dueDate) : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="${NS.inv}" xmlns:cac="${NS.cac}" xmlns:cbc="${NS.cbc}">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ProfileID>MYCASHBILL-${x(doc.type)}</cbc:ProfileID>
  <cbc:ID>${x(doc.number)}</cbc:ID>
  <cbc:IssueDate>${isoDate(doc.createdAt)}</cbc:IssueDate>${due ? `\n  <cbc:DueDate>${due}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>${TYPE_CODE[doc.type] ?? '380'}</cbc:InvoiceTypeCode>
${notes}
  <cbc:DocumentCurrencyCode>${x(cur)}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party>
    <cac:PartyName><cbc:Name>${x(sellerName)}</cbc:Name></cac:PartyName>${
      doc.company.legalAddress || doc.company.city
        ? `\n    <cac:PostalAddress>${doc.company.legalAddress ? `<cbc:StreetName>${x(doc.company.legalAddress)}</cbc:StreetName>` : ''}${doc.company.city ? `<cbc:CityName>${x(doc.company.city)}</cbc:CityName>` : ''}<cac:Country><cbc:IdentificationCode>${x(doc.company.country)}</cbc:IdentificationCode></cac:Country></cac:PostalAddress>`
        : ''
    }${
      doc.company.taxId
        ? `\n    <cac:PartyTaxScheme><cbc:CompanyID>${x(doc.company.taxId)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`
        : ''
    }${
      doc.company.legalName || doc.company.rccm
        ? `\n    <cac:PartyLegalEntity><cbc:RegistrationName>${x(doc.company.legalName ?? sellerName)}</cbc:RegistrationName>${doc.company.rccm ? `<cbc:CompanyID>${x(doc.company.rccm)}</cbc:CompanyID>` : ''}</cac:PartyLegalEntity>`
        : ''
    }
    <cac:Contact><cbc:Telephone>${x(doc.company.phone)}</cbc:Telephone></cac:Contact>
  </cac:Party></cac:AccountingSupplierParty>
${buyer}
${charge}
${tax}
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${x(cur)}">${money(p.subtotal)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${x(cur)}">${money(htBase)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${x(cur)}">${money(htBase + (vat ?? 0))}</cbc:TaxInclusiveAmount>${
      delivery > 0 ? `\n    <cbc:ChargeTotalAmount currencyID="${x(cur)}">${money(delivery)}</cbc:ChargeTotalAmount>` : ''
    }${
      p.depositAmount && p.depositAmount > 0
        ? `\n    <cbc:PrepaidAmount currencyID="${x(cur)}">${money(p.depositAmount)}</cbc:PrepaidAmount>`
        : ''
    }
    <cbc:PayableAmount currencyID="${x(cur)}">${money(p.total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines}
</Invoice>
`.replace(/\n{2,}/g, '\n');
}
