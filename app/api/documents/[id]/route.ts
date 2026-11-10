import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { createDocumentSchema } from '@/lib/validators/documents';
import { updateDraftDocument } from '@/lib/documents/update';

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
        select: { id: true, number: true, sentViaWhatsAppAt: true, sentViaEmailAt: true },
      });
      if (!doc) return jsonError('NOT_FOUND', 'Document introuvable', 404);

      // Seuls les brouillons peuvent être supprimés : un document envoyé reste dans l'historique
      // (numérotation continue).
      if (doc.sentViaWhatsAppAt || doc.sentViaEmailAt) {
        return jsonError('FORBIDDEN', 'Un document envoyé ne peut pas être supprimé.', 403);
      }

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

/** Modifie un brouillon (document non envoyé). Les documents envoyés sont refusés. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json().catch(() => null);
      const parsed = createDocumentSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError('VALIDATION_ERROR', 'Données invalides', 422, parsed.error.flatten().fieldErrors);
      }

      const result = await updateDraftDocument({
        user,
        documentId: id,
        type: parsed.data.type,
        clientId: parsed.data.clientId ?? null,
        locale: parsed.data.locale,
        payload: parsed.data.payload,
      });

      if (!result.ok) {
        switch (result.reason) {
          case 'NOT_FOUND':
          case 'CLIENT_NOT_FOUND':
            return jsonError('NOT_FOUND', 'Document introuvable', 404);
          case 'ALREADY_SENT':
            return jsonError('FORBIDDEN', 'Un document envoyé ne peut plus être modifié.', 403);
          case 'TYPE_CHANGED':
            return jsonError('VALIDATION_ERROR', "Le type d'un brouillon ne peut pas être changé.", 422);
          case 'MISSING_COMPANY_FIELDS':
            return jsonError('VALIDATION_ERROR', result.message, 422, { missingFields: result.missingFields });
          case 'BLOCKED':
            await writeAudit({
              actorId: user.id,
              targetId: id,
              action: 'document_blocked',
              meta: { reasons: result.blockedReasons, operation: 'update' },
              ip,
              userAgent,
            });
            return jsonError('DOCUMENT_BLOCKED', 'Document bloqué par la détection de fraude', 422, {
              reasons: result.blockedReasons,
            });
        }
      }

      await writeAudit({
        actorId: user.id,
        targetId: id,
        action: 'document_updated',
        meta: { number: result.number },
        ip,
        userAgent,
      });

      return jsonOk({ documentId: result.documentId, number: result.number });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
