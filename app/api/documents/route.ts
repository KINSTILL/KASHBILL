import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { documentPayloadSchema } from '@/lib/documents/payload';
import { createDocument } from '@/lib/documents/create';
import { isPro, getHistoryWindowDays } from '@/lib/auth/plan';

const createDocumentSchema = z.object({
  clientId: z.string().optional().nullable(),
  type: z.enum(['TICKET', 'BON_COMMANDE', 'BORDEREAU', 'DEVIS', 'PROFORMA', 'FACTURE', 'RECU']),
  locale: z.enum(['FR', 'EN']).default('FR'),
  payload: documentPayloadSchema,
});

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const windowDays = getHistoryWindowDays(user);
      const where = {
        userId: user.id,
        ...(windowDays !== null
          ? { createdAt: { gte: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000) } }
          : {}),
      };
      const documents = await prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          number: true,
          type: true,
          mode: true,
          locale: true,
          payload: true,
          createdAt: true,
          sentViaWhatsAppAt: true,
          watermarked: true,
        },
      });
      return jsonOk({ documents, isPro: isPro(user), historyWindowDays: windowDays });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      const body = await req2.json();
      const data = createDocumentSchema.parse(body);

      const result = await createDocument({
        user,
        clientId: data.clientId ?? null,
        type: data.type,
        mode: user.mode,
        locale: data.locale,
        payload: data.payload,
      });

      if (!result.ok) {
        await writeAudit({
          actorId: user.id,
          targetId: user.id,
          action: 'document_blocked',
          meta: { reasons: result.blockedReasons },
          ip,
          userAgent,
        });
        return jsonError('DOCUMENT_BLOCKED', 'Document bloqué par la détection de fraude', 422, {
          reasons: result.blockedReasons,
        });
      }

      await writeAudit({
        actorId: user.id,
        targetId: result.documentId,
        action: 'document_created',
        meta: { number: result.number },
        ip,
        userAgent,
      });

      return jsonOk(
        {
          documentId: result.documentId,
          number: result.number,
          publicToken: result.publicToken,
          qrCodeDataUrl: result.qrCodeDataUrl,
        },
        201
      );
    });
  } catch (err) {
    return handleApiError(err);
  }
}

