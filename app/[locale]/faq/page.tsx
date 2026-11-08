import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { FAQClient } from './FAQClient';
import { hreflangAlternates } from '@/lib/seo/hreflang';
import { env } from '@/lib/env';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === 'fr';
  const base = env.APP_URL || process.env.APP_URL || 'https://mycashbill.app';

  return {
    title: isFr ? 'Foire Aux Questions (FAQ)' : 'Frequently Asked Questions (FAQ)',
    description: isFr
      ? 'Réponses complètes aux questions fréquentes sur la facturation, les abonnements et le fonctionnement de MyCashBill.'
      : 'Comprehensive answers to frequent questions about invoicing, subscriptions, and MyCashBill.',
    alternates: {
      canonical: `${base}/${locale}/faq`,
      languages: hreflangAlternates('/faq'),
    },
  };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const entries = await prisma.fAQEntry.findMany({
    where: { locale: locale === 'fr' ? 'FR' : 'EN', isPublished: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });
  return <FAQClient entries={entries} locale={locale} />;
}

