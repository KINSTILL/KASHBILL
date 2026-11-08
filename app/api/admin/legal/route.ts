import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_legal', async (req2) => {
      const url = new URL(req2.url);
      const slug = url.searchParams.get('slug');
      const locale = url.searchParams.get('locale');
      const docs = await prisma.legalDocument.findMany({
        where: { ...(slug ? { slug } : {}), ...(locale ? { locale: locale as 'FR' | 'EN' } : {}) },
        orderBy: [{ slug: 'asc' }, { locale: 'asc' }, { createdAt: 'desc' }],
      });
      return jsonOk({ documents: docs });
    });
  } catch (err) { return handleApiError(err); }
}

const createSchema = z.object({
  slug: z.string().min(1).max(50),
  version: z.string().min(1).max(20),
  locale: z.enum(['FR', 'EN']),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_legal', async (req2, { user: admin, ip, userAgent }) => {
      const data = createSchema.parse(await req2.json());
      const doc = await prisma.legalDocument.create({
        data: { ...data, createdById: admin.id },
      });
      await writeAudit({
        actorId: admin.id, targetId: doc.id, action: 'admin_legal_created',
        meta: { slug: data.slug, version: data.version, locale: data.locale }, ip, userAgent,
      });
      return jsonOk({ document: doc }, 201);
    });
  } catch (err) { return handleApiError(err); }
}

