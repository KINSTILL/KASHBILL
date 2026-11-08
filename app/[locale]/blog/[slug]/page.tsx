import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { hreflangAlternates } from '@/lib/seo/hreflang';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([2-3])>(.*?)<\/h\1>/gi, (_, level, inner) => {
    const plainText = inner.replace(/<[^>]*>/g, '').trim();
    const id = slugifyHeading(plainText);
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const isFr = locale === 'fr';

  const article = await prisma.article.findUnique({
    where: {
      slug_locale: {
        slug,
        locale: isFr ? 'FR' : 'EN',
      },
    },
    select: {
      title: true,
      excerpt: true,
      seoTitle: true,
      seoDescription: true,
      coverUrl: true,
      publishedAt: true,
      authorName: true,
      status: true,
    },
  });

  if (!article || article.status !== 'PUBLISHED') {
    return { title: isFr ? 'Article non trouvé — MyCashBill' : 'Article Not Found — MyCashBill' };
  }

  const title = article.seoTitle || `${article.title} — Blog MyCashBill`;
  const description = article.seoDescription || article.excerpt;
  const base = env.APP_URL || process.env.APP_URL || 'https://mycashbill.app';

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/${locale}/blog/${slug}`,
      languages: hreflangAlternates(`/blog/${slug}`),
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.authorName],
      images: article.coverUrl ? [{ url: article.coverUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.coverUrl ? [article.coverUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();

  const isFr = locale === 'fr';
  const article = await prisma.article.findUnique({
    where: {
      slug_locale: {
        slug,
        locale: isFr ? 'FR' : 'EN',
      },
    },
  });

  if (
    !article ||
    article.status !== 'PUBLISHED' ||
    !article.publishedAt ||
    article.publishedAt > new Date()
  ) {
    notFound();
  }

  // Increment views count silently
  prisma.article
    .update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    })
    .catch(() => {});

  // Extract TOC headings (H2 & H3)
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: Array<{ level: number; text: string; id: string }> = [];
  let match;
  while ((match = headingRegex.exec(article.content)) !== null) {
    if (match[1] && match[2]) {
      const level = match[1].length;
      const rawText = match[2].trim().replace(/[*_`]/g, '');
      const id = slugifyHeading(rawText);
      toc.push({ level, text: rawText, id });
    }
  }

  // Render markdown safely
  const rawHtml = await marked.parse(article.content);
  const safeHtml = DOMPurify.sanitize(addHeadingIds(rawHtml));

  // Related articles (same tag)
  const relatedArticles =
    article.tags.length > 0
      ? await prisma.article.findMany({
          where: {
            id: { not: article.id },
            locale: article.locale,
            status: 'PUBLISHED',
            publishedAt: { lte: new Date() },
            tags: { hasSome: article.tags },
          },
          take: 3,
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            coverUrl: true,
            readingTime: true,
            publishedAt: true,
          },
        })
      : [];

  const shareUrl = `${env.APP_URL}/${locale}/blog/${article.slug}`;
  const whatsappShareText = `${article.title}\n\n${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    image: article.coverUrl ? [article.coverUrl] : undefined,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: [{ '@type': 'Person', 'name': article.authorName }],
    publisher: {
      '@type': 'Organization',
      name: 'MyCashBill',
      url: env.APP_URL,
    },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link href={`/${locale}/blog` as Route} className="hover:text-sage-700 hover:underline">
          {isFr ? '← Retour au blog' : '← Back to blog'}
        </Link>
      </nav>

      <article className="space-y-8">
        {/* Header */}
        <header className="space-y-4 border-b border-slate-200 pb-8">
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((t) => (
                <Link
                  key={t}
                  href={`/${locale}/blog?tag=${encodeURIComponent(t)}` as Route}
                  className="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800 hover:bg-sage-200"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-5xl">
            {article.title}
          </h1>

          <p className="text-lg text-slate-600 md:text-xl">{article.excerpt}</p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700">{article.authorName}</span>
              <span>·</span>
              <time dateTime={article.publishedAt.toISOString()}>
                {new Date(article.publishedAt).toLocaleDateString(isFr ? 'fr-FR' : 'en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              {article.readingTime > 0 && (
                <>
                  <span>·</span>
                  <span>
                    {article.readingTime} min {isFr ? 'de lecture' : 'read'}
                  </span>
                </>
              )}
            </div>

            {/* WhatsApp Share Button Top */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#20ba59]"
            >
              <span>💬</span>
              {isFr ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}
            </a>
          </div>
        </header>

        {/* Cover image */}
        {article.coverUrl && (
          <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverUrl}
              alt={article.title}
              className="max-h-[480px] w-full object-cover"
            />
          </div>
        )}

        {/* Layout with TOC and Content */}
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Main content */}
          <div className="lg:col-span-3">
            <div
              className="prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:text-ink prose-a:text-sage-600 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />

            {/* WhatsApp Share Box Bottom */}
            <div className="mt-12 rounded-xl border border-emerald-100 bg-emerald-50/60 p-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <p className="font-semibold text-emerald-950">
                  {isFr ? 'Cet article vous a été utile ?' : 'Found this article helpful?'}
                </p>
                <p className="text-xs text-emerald-800">
                  {isFr
                    ? 'Partagez-le avec d’autres entrepreneurs et gérants d’entreprise.'
                    : 'Share it with fellow business owners and entrepreneurs.'}
                </p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#20ba59]"
              >
                <span>💬</span>
                {isFr ? 'Partager sur WhatsApp' : 'Share on WhatsApp'}
              </a>
            </div>
          </div>

          {/* Table of contents (Sticky sidebar) */}
          {toc.length > 0 && (
            <aside className="order-first lg:order-last lg:col-span-1">
              <div className="sticky top-20 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isFr ? 'Sommaire' : 'Table of Contents'}
                </p>
                <nav className="space-y-1.5 text-xs">
                  {toc.map((item, idx) => (
                    <a
                      key={idx}
                      href={`#${item.id}`}
                      className={`block text-slate-600 hover:text-sage-700 hover:underline ${
                        item.level === 3 ? 'pl-3 text-[11px]' : 'font-medium'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-10">
          <h2 className="mb-6 text-xl font-bold text-ink">
            {isFr ? 'Articles liés' : 'Related Articles'}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedArticles.map((rel) => (
              <article
                key={rel.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {rel.coverUrl && (
                  <Link
                    href={`/${locale}/blog/${rel.slug}` as Route}
                    className="block h-36 overflow-hidden bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rel.coverUrl}
                      alt={rel.title}
                      className="h-full w-full object-cover transition hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-bold text-ink">
                    <Link
                      href={`/${locale}/blog/${rel.slug}` as Route}
                      className="hover:text-sage-700 hover:underline"
                    >
                      {rel.title}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{rel.excerpt}</p>
                  <div className="mt-auto pt-3 text-[11px] text-slate-400">
                    {rel.readingTime > 0 && (
                      <span>
                        {rel.readingTime} min {isFr ? 'de lecture' : 'read'}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Schema.org Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
