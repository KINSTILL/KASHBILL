import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
    title: isFr
      ? 'Foire Aux Questions (FAQ) — MyCashBill'
      : 'Frequently Asked Questions (FAQ) — MyCashBill',
    description: isFr
      ? 'Réponses complètes aux questions fréquentes sur la facturation, les abonnements et le fonctionnement de MyCashBill.'
      : 'Comprehensive answers to frequent questions about invoicing, subscriptions, and MyCashBill.',
    alternates: {
      canonical: `${base}/${locale}/faq`,
      languages: hreflangAlternates('/faq'),
    },
  };
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();

  const targetLocale = locale === 'fr' ? ('FR' as const) : ('EN' as const);

  // Requête unifiée via prisma.article
  const articles = await prisma.article.findMany({
    where: {
      category: 'FAQ',
      locale: targetLocale,
      published: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const entries =
    articles.length > 0
      ? articles.map((a) => ({
          id: a.id,
          category: a.tags[0] ?? 'general',
          question: a.title,
          answer: a.content,
          helpful: 0,
          notHelpful: 0,
        }))
      : await prisma.fAQEntry.findMany({
          where: { locale: targetLocale, isPublished: true },
          orderBy: [{ category: 'asc' }, { order: 'asc' }],
        });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: e.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FAQClient entries={entries} locale={locale} />
    </>
  );
}
