import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { generateQrCode } from '@/lib/documents/integrity';
import { env } from '@/lib/env';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import type { PdfDocument, PdfFormat, PdfPayload } from '@/lib/pdf/types';
import { getCurrencyForCountry } from '@/lib/countries/currency';
import { isWhiteLabelActive } from '@/lib/addons/queries';

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { locale, id } = await params;
  const { format: formatQuery } = await searchParams;

  const current = await getCurrentUser();
  if (!current) {
    redirect(`/${locale}/login` as Route);
  }

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      client: true,
      user: true,
      verification: true,
    },
  });

  if (!doc || doc.userId !== current.user.id) {
    notFound();
  }

  const publicToken = doc.verification?.publicToken ?? null;
  const qrCodeDataUrl =
    doc.qrCodeUrl || (publicToken ? await generateQrCode(publicToken, env.APP_URL) : null);
  const whiteLabel = await isWhiteLabelActive(doc.userId);

  const pdfDoc: PdfDocument = {
    id: doc.id,
    number: doc.number,
    type: doc.type,
    locale: doc.locale,
    createdAt: doc.createdAt,
    payload: doc.payload as unknown as PdfPayload,
    company: {
      businessName: doc.user.businessName,
      legalName: doc.user.legalName,
      city: doc.user.city,
      legalAddress: doc.user.legalAddress,
      phone: doc.user.phone,
      taxId: doc.user.taxId,
      rccm: doc.user.rccm,
      logoUrl: doc.user.logoUrl,
      signatureUrl: doc.user.signatureUrl,
      stampUrl: doc.user.stampUrl,
      headerText: doc.user.headerText,
      footerText: doc.user.footerText,
      cgvText: doc.user.cgvText,
      legalForm: doc.user.legalForm,
      country: doc.user.country,
      currency: getCurrencyForCountry(doc.user.country),
    },
    client: doc.client
      ? {
          name: doc.client.name,
          phone: doc.client.phone,
          email: doc.client.email ?? null,
          address: doc.client.address,
          taxId: doc.client.taxId ?? null,
        }
      : null,
    qrCodeDataUrl,
    publicToken,
    watermarked: doc.watermarked,
    referralCode: doc.user.referralCode,
    cgvText: doc.user.cgvText,
    whiteLabel,
  };

  const initialFormat: PdfFormat =
    formatQuery === 'ticket'
      ? 'ticket'
      : formatQuery === 'a4'
      ? 'a4'
      : doc.type === 'TICKET' || doc.type === 'RECU'
      ? 'ticket'
      : 'a4';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {doc.number} ({doc.type})
        </h1>
      </div>
      <DocumentPreview pdfDoc={pdfDoc} initialFormat={initialFormat} />
    </div>
  );
}

