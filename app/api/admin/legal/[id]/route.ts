import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_legal', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const data = patchSchema.parse(await req2.json());
      const existing = await prisma.legalDocument.findUnique({ where: { id } });
      if (!existing) return jsonError('NOT_FOUND', 'Document introuvable', 404);

      const update: Record<string, unknown> = {};
      if (data.title) update.title = data.title;
      if (data.content) update.content = data.content;
      if (data.status) {
        update.status = data.status;
        if (data.status === 'PUBLISHED' && !existing.publishedAt) {
          update.publishedAt = new Date();
          update.effectiveAt = new Date();
        }
      }

      const doc = await prisma.legalDocument.update({ where: { id }, data: update });
      await writeAudit({
        actorId: admin.id, targetId: id, action: 'admin_legal_updated',
        meta: { slug: doc.slug, version: doc.version, newStatus: doc.status }, ip, userAgent,
      });
      return jsonOk({ document: doc });
    });
  } catch (err) { return handleApiError(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_legal', async (_req, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const existing = await prisma.legalDocument.findUnique({ where: { id } });
      if (!existing) return jsonError('NOT_FOUND', 'Document introuvable', 404);
      if (existing.status === 'PUBLISHED') {
        return jsonError('FORBIDDEN', 'Impossible de supprimer un document publié. Archivez-le.', 403);
      }
      await prisma.legalDocument.delete({ where: { id } });
      await writeAudit({
        actorId: admin.id, targetId: id, action: 'admin_legal_deleted',
        meta: { slug: existing.slug, version: existing.version }, ip, userAgent,
      });
      return jsonOk({ ok: true });
    });
  } catch (err) { return handleApiError(err); }
}

