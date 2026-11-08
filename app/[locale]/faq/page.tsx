import { prisma } from '@/lib/db';
import { FAQClient } from './FAQClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — MyCashBill',
  description: 'Réponses aux questions fréquentes sur MyCashBill',
};

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const entries = await prisma.fAQEntry.findMany({
    where: { locale: locale === 'fr' ? 'FR' : 'EN', isPublished: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });
  return <FAQClient entries={entries} locale={locale} />;
}

