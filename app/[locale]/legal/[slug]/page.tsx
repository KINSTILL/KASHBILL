import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { LEGAL_SLUGS, getLegalDoc, type LegalSlug } from '@/lib/legal/loader';
import { hreflangAlternates } from '@/lib/seo/hreflang';
import { env } from '@/lib/env';
import type { Metadata } from 'next';

type Props = { params: Promise<{ locale: string; slug: string }> };

const LEGAL_NAV_ITEMS: Array<{
  slug: LegalSlug;
  labelFr: string;
  labelEn: string;
}> = [
  { slug: 'mentions-legales', labelFr: 'Mentions légales', labelEn: 'Legal Notice' },
  { slug: 'cgu', labelFr: 'CGU', labelEn: 'Terms of Use (CGU)' },
  { slug: 'cgv', labelFr: 'CGV', labelEn: 'Terms of Sale (CGV)' },
  { slug: 'privacy', labelFr: 'Confidentialité', labelEn: 'Privacy Policy' },
  { slug: 'cookies', labelFr: 'Cookies', labelEn: 'Cookie Policy' },
  { slug: 'refund', labelFr: 'Remboursement', labelEn: 'Refund Policy' },
  { slug: 'disclaimer', labelFr: 'Non-responsabilité', labelEn: 'Disclaimer' },
];

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
  const isEn = locale === 'en';

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      {/* Barre d'onglets en haut de page (Proposition 1) */}
      <nav
        aria-label={isEn ? 'Legal documents' : 'Documents juridiques'}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs"
      >
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {isEn ? 'Legal Center — Official Documents' : 'Centre Juridique — Documents officiels'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {LEGAL_NAV_ITEMS.map((item) => {
            const active = item.slug === slug;
            return (
              <Link
                key={item.slug}
                href={`/${locale}/legal/${item.slug}` as Route}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  active
                    ? 'bg-emerald-600 font-bold text-white shadow-xs'
                    : 'bg-slate-100 font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                {isEn ? item.labelEn : item.labelFr}
              </Link>
            );
          })}
        </div>
      </nav>

      <header className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">{doc.title}</h1>
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
