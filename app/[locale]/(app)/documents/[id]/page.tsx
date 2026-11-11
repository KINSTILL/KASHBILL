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
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Pencil } from 'lucide-react';
import { readImageFile } from '@/lib/uploads/image';

async function resolveUploadDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/api/uploads/')) {
    const filename = url.slice('/api/uploads/'.length);
    try {
      const buffer = await readImageFile(filename);
      const isPng =
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47;
      const mime = isPng ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${buffer.toString('base64')}`;
    } catch {
      return null;
    }
  }
  return null;
}

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
  const [qrCodeDataUrl, whiteLabel, resolvedLogoUrl, resolvedSignatureUrl, resolvedStampUrl] =
    await Promise.all([
      doc.qrCodeUrl
        ? Promise.resolve(doc.qrCodeUrl)
        : publicToken
          ? generateQrCode(publicToken, env.APP_URL).catch(() => null)
          : Promise.resolve(null),
      isWhiteLabelActive(doc.userId),
      resolveUploadDataUrl(doc.user.logoUrl),
      resolveUploadDataUrl(doc.user.signatureUrl),
      resolveUploadDataUrl(doc.user.stampUrl),
    ]);

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
      logoUrl: resolvedLogoUrl,
      signatureUrl: resolvedSignatureUrl,
      stampUrl: resolvedStampUrl,
      headerText: doc.user.headerText,
      footerText: doc.user.footerText,
      cgvText: doc.user.cgvText,
      legalForm: doc.user.legalForm,
      country: doc.user.country,
      currency: getCurrencyForCountry(doc.user.country),
      // Couleurs de marque : réservées au white label (sinon palette MyCashBill par défaut)
      brand:
        whiteLabel && doc.user.brandPrimaryColor && doc.user.brandAccentColor
          ? { primary: doc.user.brandPrimaryColor, accent: doc.user.brandAccentColor }
          : null,
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

  // Un document n'est modifiable qu'en brouillon (tant qu'il n'a pas été envoyé).
  const isDraft = !doc.sentViaWhatsAppAt && !doc.sentViaEmailAt;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {doc.number} ({doc.type})
        </h1>
        {isDraft && (
          <Link href={`/${locale}/documents/${id}/edit` as Route} className="shrink-0">
            <Button size="sm" variant="secondary" className="gap-1.5 font-bold">
              <Pencil className="h-4 w-4" />
              <span>Modifier</span>
            </Button>
          </Link>
        )}
      </div>
      <DocumentPreview pdfDoc={pdfDoc} initialFormat={initialFormat} />
    </div>
  );
}

