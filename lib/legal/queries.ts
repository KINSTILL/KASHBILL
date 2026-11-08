import { prisma } from '@/lib/db';
import type { LegalDocument, Locale } from '@prisma/client';
import type { LegalSlug } from './constants';

export async function getPublishedLegal(slug: LegalSlug, locale: Locale): Promise<LegalDocument | null> {
  return prisma.legalDocument.findFirst({
    where: { slug, locale, status: 'PUBLISHED' },
    orderBy: { effectiveAt: 'desc' },
  });
}

export async function getAllPublishedLegal(locale: Locale): Promise<LegalDocument[]> {
  const docs = await prisma.legalDocument.findMany({
    where: { locale, status: 'PUBLISHED' },
    orderBy: [{ slug: 'asc' }, { effectiveAt: 'desc' }],
  });
  const latest = new Map<string, LegalDocument>();
  for (const d of docs) {
    if (!latest.has(d.slug)) latest.set(d.slug, d);
  }
  return Array.from(latest.values());
}

export async function getCurrentConsentVersions(locale: Locale): Promise<Record<string, string>> {
  const { CONSENT_REQUIRED_SLUGS } = await import('./constants');
  const result: Record<string, string> = {};
  for (const slug of CONSENT_REQUIRED_SLUGS) {
    const doc = await getPublishedLegal(slug, locale);
    if (doc) result[slug] = doc.version;
  }
  return result;
}

export async function hasUserConsented(
  userId: string,
  slug: LegalSlug,
  version: string
): Promise<boolean> {
  const consent = await prisma.userConsent.findUnique({
    where: { userId_documentSlug_version: { userId, documentSlug: slug, version } },
  });
  return Boolean(consent);
}

export async function recordConsent(
  userId: string,
  slug: LegalSlug,
  version: string,
  ip: string | null,
  userAgent: string | null
): Promise<void> {
  const doc = await prisma.legalDocument.findFirst({
    where: { slug, version, status: 'PUBLISHED' },
  });
  await prisma.userConsent.upsert({
    where: { userId_documentSlug_version: { userId, documentSlug: slug, version } },
    update: {},
    create: { userId, documentSlug: slug, version, legalDocumentId: doc?.id ?? null, ip, userAgent },
  });
}

