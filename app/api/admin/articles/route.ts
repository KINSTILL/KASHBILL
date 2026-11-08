import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_articles', async () => {
      const articles = await prisma.article.findMany({
        orderBy: [{ createdAt: 'desc' }],
      });
      return jsonOk({ articles });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().optional(),
  locale: z.enum(['FR', 'EN']),
  excerpt: z.string().min(1).max(1000),
  content: z.string().min(1),
  coverUrl: z.string().url().nullable().optional(),
  authorName: z.string().min(1).max(100),
  tags: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  publishedAt: z.coerce.date().nullable().optional(),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(500).nullable().optional(),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_articles', async (req2, { user: admin, ip, userAgent }) => {
      const data = createSchema.parse(await req2.json());

      const baseSlug = (data.slug ? generateSlug(data.slug) : generateSlug(data.title)) || `article-${Date.now()}`;
      let slug = baseSlug;
      let counter = 1;
      while (
        await prisma.article.findUnique({
          where: { slug_locale: { slug, locale: data.locale } },
        })
      ) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }

      const readingTime = calculateReadingTime(data.content);
      const publishedAt =
        data.status === 'PUBLISHED' ? data.publishedAt ?? new Date() : data.publishedAt ?? null;

      const article = await prisma.article.create({
        data: {
          slug,
          locale: data.locale,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          coverUrl: data.coverUrl ?? null,
          authorName: data.authorName,
          tags: data.tags,
          status: data.status,
          publishedAt,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          readingTime,
        },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: article.id,
        action: 'admin_article_created',
        meta: { slug: article.slug, title: article.title, locale: article.locale },
        ip,
        userAgent,
      });

      return jsonOk({ article }, 201);
    });
  } catch (err) {
    return handleApiError(err);
  }
}
