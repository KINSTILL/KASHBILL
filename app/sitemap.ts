import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { LEGAL_SLUGS } from '@/lib/legal/loader';
import { env } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.APP_URL;
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/fr`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/en`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/fr/faq`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/en/faq`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/fr/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/en/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/fr/upgrade`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/en/upgrade`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  for (const slug of LEGAL_SLUGS) {
    entries.push({ url: `${base}/fr/legal/${slug}`, changeFrequency: 'yearly', priority: 0.3 });
    entries.push({ url: `${base}/en/legal/${slug}`, changeFrequency: 'yearly', priority: 0.3 });
  }

  const articles = await prisma.article
    .findMany({
      where: { published: true, category: 'BLOG' },
      select: { slug: true, locale: true, updatedAt: true },
    })
    .catch(() => []);

  for (const a of articles) {
    const loc = String(a.locale).toLowerCase();
    entries.push({
      url: `${base}/${loc}/blog/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
