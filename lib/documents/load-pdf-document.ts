import { prisma } from '@/lib/db';
import { generateQrCode } from '@/lib/documents/integrity';
import { env } from '@/lib/env';
import { getCurrencyForCountry } from '@/lib/countries/currency';
import { isWhiteLabelActive } from '@/lib/addons/queries';
import { readImageFile } from '@/lib/uploads/image';
import type { PdfDocument, PdfPayload } from '@/lib/pdf/types';
import { applyImageBrandingPolicy } from '@/lib/branding/policy';
import { isPro } from '@/lib/auth/plan';

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

/**
 * Charge un document de l'utilisateur et le transforme en entrée du rendu PDF.
 * Retourne null si le document n'existe pas ou appartient à un autre utilisateur.
 */
export async function loadPdfDocument(
  id: string,
  userId: string
): Promise<{ doc: NonNullable<Awaited<ReturnType<typeof findDoc>>>; pdfDoc: PdfDocument } | null> {
  const doc = await findDoc(id);
  if (!doc || doc.userId !== userId) return null;

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
    // Filigrane selon le plan actuel : un compte non Pro garde le filigrane, même pour un ancien document
    watermarked: doc.watermarked || !isPro(doc.user),
    referralCode: doc.user.referralCode,
    cgvText: doc.user.cgvText,
    whiteLabel,
    decimalPlaces: doc.user.decimalPlaces,
  };

  // Logo, signature et cachet : uniquement si l'abonnement Pro est actif
  pdfDoc.company = {
    ...applyImageBrandingPolicy(pdfDoc.company, doc.user),
    showStampOnTicket: doc.user.showStampOnTicket && isPro(doc.user),
  };

  return { doc, pdfDoc };
}

function findDoc(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { client: true, user: true, verification: true },
  });
}
