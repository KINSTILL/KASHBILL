import { prisma } from '@/lib/db';
import { env } from '@/lib/env';

function escapeCdata(str: string): string {
  return str.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> }
): Promise<Response> {
  const { locale } = await params;
  if (locale !== 'fr' && locale !== 'en') {
    return new Response('Not Found', { status: 404 });
  }

  const isFr = locale === 'fr';
  const now = new Date();

  const articles = await prisma.article.findMany({
    where: {
      locale: isFr ? 'FR' : 'EN',
      status: 'PUBLISHED',
      publishedAt: { lte: now },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
    },
  });

  const base = env.APP_URL || process.env.APP_URL || 'https://mycashbill.app';
  const siteTitle = isFr ? 'Blog MyCashBill' : 'MyCashBill Blog';
  const siteDesc = isFr
    ? 'Articles et conseils pratiques de gestion et facturation'
    : 'Articles and invoicing guides for entrepreneurs';

  const itemsXml = articles
    .map((a) => {
      const pubDate = a.publishedAt ? a.publishedAt.toUTCString() : now.toUTCString();
      const articleUrl = `${base}/${locale}/blog/${a.slug}`;
      return `    <item>
      <title><![CDATA[${escapeCdata(a.title)}]]></title>
      <link>${articleUrl}</link>
      <description><![CDATA[${escapeCdata(a.excerpt)}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${articleUrl}</guid>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${base}/${locale}/blog</link>
    <description>${siteDesc}</description>
    <language>${locale}</language>
    <atom:link href="${base}/${locale}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
