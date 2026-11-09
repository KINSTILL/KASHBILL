import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { hreflangAlternates } from '@/lib/seo/hreflang';
import { env } from '@/lib/env';

const PAGE_SIZE = 10;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; tag?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === 'fr';
  const base = env.APP_URL || process.env.APP_URL || 'https://mycashbill.app';

  return {
    title: isFr ? 'Blog & Conseils Facturation — MyCashBill' : 'Blog & Invoicing Tips — MyCashBill',
    description: isFr
      ? 'Actualités, guides et astuces de gestion commerciale et facturation pour entrepreneurs africains.'
      : 'News, guides, and invoicing tips for African business owners.',
    alternates: {
      canonical: `${base}/${locale}/blog`,
      languages: hreflangAlternates('/blog'),
    },
  };
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== 'fr' && locale !== 'en') notFound();

  const isFr = locale === 'fr';
  const sp = await searchParams;
  const pageNum = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const selectedTag = typeof sp.tag === 'string' && sp.tag.trim() ? sp.tag.trim() : undefined;

  const where = {
    category: 'BLOG',
    locale: isFr ? ('FR' as const) : ('EN' as const),
    published: true,
    ...(selectedTag ? { tags: { has: selectedTag } } : {}),
  };

  const [articles, totalCount, allTagsRaw] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverUrl: true,
        authorName: true,
        tags: true,
        readingTime: true,
        publishedAt: true,
      },
    }),
    prisma.article.count({ where }),
    prisma.article.findMany({
      where: {
        category: 'BLOG',
        locale: isFr ? ('FR' as const) : ('EN' as const),
        published: true,
      },
      select: { tags: true },
      take: 100,
    }),
  ]);

  const uniqueTags = Array.from(new Set(allTagsRaw.flatMap((a) => a.tags))).slice(0, 15);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const buildUrl = (page: number, tag?: string) => {
    const query = new URLSearchParams();
    if (page > 1) query.set('page', String(page));
    if (tag) query.set('tag', tag);
    const qs = query.toString();
    return `/${locale}/blog${qs ? `?${qs}` : ''}` as Route;
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          {isFr ? 'Le Blog MyCashBill' : 'The MyCashBill Blog'}
        </h1>
        <p className="mt-2 text-slate-600">
          {isFr
            ? 'Conseils pratiques, actualités fiscales et astuces pour développer votre activité en Afrique.'
            : 'Practical advice, tax tips, and best practices to grow your business in Africa.'}
        </p>

        {uniqueTags.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link
              href={buildUrl(1)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                !selectedTag
                  ? 'bg-sage-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isFr ? 'Tous les articles' : 'All articles'}
            </Link>
            {uniqueTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <Link
                  key={tag}
                  href={buildUrl(1, active ? undefined : tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-sage-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  #{tag}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {articles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-500">
            {isFr
              ? selectedTag
                ? `Aucun article trouvé pour le tag #${selectedTag}.`
                : 'Aucun article publié pour le moment. Revenez bientôt !'
              : selectedTag
                ? `No articles found for tag #${selectedTag}.`
                : 'No articles published yet. Check back soon!'}
          </p>
          {selectedTag && (
            <Link
              href={buildUrl(1)}
              className="mt-4 inline-block text-sm font-semibold text-sage-600 hover:underline"
            >
              {isFr ? 'Voir tous les articles' : 'View all articles'}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {article.coverUrl && (
                <Link href={`/${locale}/blog/${article.slug}` as Route} className="relative block h-44 overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.coverUrl}
                    alt={article.title}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </Link>
              )}
              <div className="flex flex-1 flex-col p-5">
                {article.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {article.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-sage-50 px-2 py-0.5 text-[11px] font-medium text-sage-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="text-lg font-bold text-ink">
                  <Link
                    href={`/${locale}/blog/${article.slug}` as Route}
                    className="hover:text-sage-700 hover:underline"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{article.excerpt}</p>
                <div className="mt-auto pt-4 text-xs text-slate-400 flex items-center justify-between">
                  <span>{article.authorName}</span>
                  <div className="flex items-center gap-2">
                    {article.readingTime > 0 && (
                      <span>
                        {article.readingTime} min {isFr ? 'de lecture' : 'read'}
                      </span>
                    )}
                    {article.publishedAt && (
                      <span>
                        ·{' '}
                        {new Date(article.publishedAt).toLocaleDateString(
                          isFr ? 'fr-FR' : 'en-GB',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
          {pageNum > 1 && (
            <Link
              href={buildUrl(pageNum - 1, selectedTag)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {isFr ? '← Précédent' : '← Previous'}
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-slate-500">
            Page {pageNum} / {totalPages}
          </span>
          {pageNum < totalPages && (
            <Link
              href={buildUrl(pageNum + 1, selectedTag)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {isFr ? 'Suivant →' : 'Next →'}
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
