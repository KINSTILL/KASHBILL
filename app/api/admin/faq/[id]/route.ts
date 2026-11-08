import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

const patchSchema = z.object({
  category: z.enum(['account', 'documents', 'billing', 'technical', 'legal']).optional(),
  order: z.number().int().nonnegative().optional(),
  question: z.string().min(1).max(300).optional(),
  answer: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_faq', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const data = patchSchema.parse(await req2.json());
      const existing = await prisma.fAQEntry.findUnique({ where: { id } });
      if (!existing) return jsonError('NOT_FOUND', 'Introuvable', 404);
      const entry = await prisma.fAQEntry.update({ where: { id }, data });
      await writeAudit({ actorId: admin.id, targetId: id, action: 'admin_faq_updated', meta: data, ip, userAgent });
      return jsonOk({ entry });
    });
  } catch (err) { return handleApiError(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_faq', async (_req, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      await prisma.fAQEntry.delete({ where: { id } });
      await writeAudit({ actorId: admin.id, targetId: id, action: 'admin_faq_deleted', ip, userAgent });
      return jsonOk({ ok: true });
    });
  } catch (err) { return handleApiError(err); }
}

