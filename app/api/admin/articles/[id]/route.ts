import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  locale: z.enum(['FR', 'EN']).optional(),
  excerpt: z.string().min(1).max(1000).optional(),
  content: z.string().min(1).optional(),
  coverUrl: z.string().url().nullable().optional(),
  authorName: z.string().min(1).max(100).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  publishedAt: z.coerce.date().nullable().optional(),
  seoTitle: z.string().max(200).nullable().optional(),
  seoDescription: z.string().max(500).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_articles', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const data = patchSchema.parse(await req2.json());

      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) return jsonError('NOT_FOUND', 'Article introuvable', 404);

      const targetSlug = data.slug ?? existing.slug;
      const targetLocale = data.locale ?? existing.locale;

      if (
        (data.slug && data.slug !== existing.slug) ||
        (data.locale && data.locale !== existing.locale)
      ) {
        const conflict = await prisma.article.findUnique({
          where: { slug_locale: { slug: targetSlug, locale: targetLocale } },
        });
        if (conflict && conflict.id !== id) {
          return jsonError('CONFLICT', 'Un article avec ce slug et cette langue existe déjà', 409);
        }
      }

      const readingTime = data.content ? calculateReadingTime(data.content) : undefined;

      let publishedAt = data.publishedAt;
      if (data.status === 'PUBLISHED') {
        if (publishedAt === undefined) {
          if (!existing.publishedAt) publishedAt = new Date();
        } else if (publishedAt === null) {
          publishedAt = new Date();
        }
      }

      const article = await prisma.article.update({
        where: { id },
        data: {
          ...data,
          ...(readingTime !== undefined ? { readingTime } : {}),
          ...(publishedAt !== undefined ? { publishedAt } : {}),
        },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_article_updated',
        meta: { ...data, ...(publishedAt ? { publishedAt: publishedAt.toISOString() } : {}) },
        ip,
        userAgent,
      });

      return jsonOk({ article });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_articles', async (_req, { user: admin, ip, userAgent }) => {
      const { id } = await params;

      const existing = await prisma.article.findUnique({ where: { id } });
      if (!existing) return jsonError('NOT_FOUND', 'Article introuvable', 404);

      await prisma.article.delete({ where: { id } });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_article_deleted',
        meta: { title: existing.title, slug: existing.slug, locale: existing.locale },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
