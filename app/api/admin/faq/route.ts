import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_faq', async () => {
      const entries = await prisma.fAQEntry.findMany({ orderBy: [{ category: 'asc' }, { order: 'asc' }, { locale: 'asc' }] });
      return jsonOk({ entries });
    });
  } catch (err) { return handleApiError(err); }
}

const createSchema = z.object({
  category: z.enum(['account', 'documents', 'billing', 'technical', 'legal']),
  order: z.number().int().nonnegative().default(0),
  locale: z.enum(['FR', 'EN']),
  question: z.string().min(1).max(300),
  answer: z.string().min(1),
  isPublished: z.boolean().default(true),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_faq', async (req2, { user: admin, ip, userAgent }) => {
      const data = createSchema.parse(await req2.json());
      const entry = await prisma.fAQEntry.create({ data });
      await writeAudit({ actorId: admin.id, targetId: entry.id, action: 'admin_faq_created', meta: { question: data.question }, ip, userAgent });
      return jsonOk({ entry }, 201);
    });
  } catch (err) { return handleApiError(err); }
}

