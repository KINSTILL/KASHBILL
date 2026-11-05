import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const { id } = await params;
      const doc = await prisma.document.findFirst({
        where: { id, userId: user.id },
        include: { client: true, verification: true },
      });
      if (!doc) return jsonError('NOT_FOUND', 'Document introuvable', 404);
      return jsonOk({ document: doc });
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
    return await requireAuth(req, async (_req, { user, ip, userAgent }) => {
      const { id } = await params;
      const doc = await prisma.document.findFirst({
        where: { id, userId: user.id },
        select: { id: true, number: true },
      });
      if (!doc) return jsonError('NOT_FOUND', 'Document introuvable', 404);

      // La suppression est définitive. La vérification (DocumentVerification) est
      // supprimée en cascade ; les flags de fraude liés passent à null (onDelete: SetNull).
      await prisma.document.delete({ where: { id } });

      await writeAudit({
        actorId: user.id,
        targetId: id,
        action: 'document_deleted',
        meta: { number: doc.number },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
