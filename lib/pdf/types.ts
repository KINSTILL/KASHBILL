import type { DocType, Locale } from '@prisma/client';

export type PdfFormat = 'ticket' | 'a4';

export type PdfLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  photoUrl?: string | null;
};

export type PdfPayload = {
  lines: PdfLine[];
  subtotal: number;
  vatRate: number | null;
  vatAmount: number | null;
  depositAmount: number | null;
  deliveryFee: number | null;
  total: number;
  notes: string | null;
  validityDays?: number | null;
  dueDate?: string | null;
  referenceNumber?: string | null;
  paymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHECK' | null;
  paymentReference?: string | null;
  paymentOperator?: string | null;
  paymentOperatorFreeText?: string | null;
  equivalentCurrency?: string | null;
  equivalentAmount?: number | null;
  exchangeRate?: number | null;
  exchangeRateNote?: string | null;
  deliveryDate?: string | null;
  deliveryAddress?: string | null;
};

export type PdfCompany = {
  businessName: string | null;
  legalName: string | null;
  city: string | null;
  legalAddress: string | null;
  phone: string;
  taxId: string | null;
  rccm: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  stampUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  cgvText: string | null;
  legalForm?: string | null;
  country: string;
  currency: string;
};

export type PdfClient = {
  name: string;
  phone: string | null;
  email?: string | null;
  address: string | null;
  taxId?: string | null;
};

export type PdfDocument = {
  id?: string;
  number: string;
  type: DocType;
  locale: Locale;
  createdAt: Date;
  payload: PdfPayload;
  company: PdfCompany;
  client: PdfClient | null;
  qrCodeDataUrl: string | null;
  publicToken: string | null;
  watermarked: boolean;
  referralCode: string | null;
  cgvText?: string | null;
  whiteLabel?: boolean;
};

export type PdfRenderOptions = {
  format: PdfFormat;
  showLogo: boolean;
  showSignature: boolean;
  showStamp: boolean;
  showCgv: boolean;
  showWatermark: boolean;
  whiteLabel?: boolean;
};
