import { notFound } from 'next/navigation';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { LEGAL_SLUGS, getLegalDoc, type LegalSlug } from '@/lib/legal/loader';
import { hreflangAlternates } from '@/lib/seo/hreflang';
import { env } from '@/lib/env';
import type { Metadata } from 'next';

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of ['fr', 'en']) {
    for (const slug of LEGAL_SLUGS) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!LEGAL_SLUGS.includes(slug as LegalSlug) || (locale !== 'fr' && locale !== 'en')) {
    return { title: 'Document légal — MyCashBill' };
  }

  const doc = await getLegalDoc(slug as LegalSlug, locale as 'fr' | 'en');
  const base = env.APP_URL || 'https://mycashbill.app';

  return {
    title: doc?.title ? `${doc.title} — MyCashBill` : 'Document légal — MyCashBill',
    description: `Consultez les documents officiels : ${doc?.title ?? 'légal'}.`,
    alternates: {
      canonical: `${base}/${locale}/legal/${slug}`,
      languages: hreflangAlternates(`/legal/${slug}`),
    },
  };
}

export default async function LegalPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) notFound();
  if (locale !== 'fr' && locale !== 'en') notFound();

  const doc = await getLegalDoc(slug as LegalSlug, locale);
  if (!doc) notFound();

  const rawHtml = await marked(doc.content);
  const html = DOMPurify.sanitize(rawHtml);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-ink">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Version {doc.version} ·{' '}
          {new Date(doc.effectiveDate).toLocaleDateString(
            locale === 'fr' ? 'fr-FR' : 'en-GB'
          )}
        </p>
      </header>
      <article
        className="legal-prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
