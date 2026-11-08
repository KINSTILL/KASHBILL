import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { getPublishedLegal } from '@/lib/legal/queries';
import { LEGAL_SLUG_LIST, type LegalSlug } from '@/lib/legal/constants';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function LegalPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!LEGAL_SLUG_LIST.includes(slug as LegalSlug)) notFound();
  if (locale !== 'fr' && locale !== 'en') notFound();

  const doc = await getPublishedLegal(
    slug as LegalSlug,
    locale === 'fr' ? 'FR' : 'EN'
  );
  if (!doc) notFound();

  const html = await marked(doc.content);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-ink">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Version {doc.version}
          {doc.effectiveAt && ` · En vigueur le ${new Date(doc.effectiveAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')}`}
        </p>
      </header>
      <article
        className="prose prose-slate max-w-none prose-headings:text-ink prose-a:text-sage-600"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}

