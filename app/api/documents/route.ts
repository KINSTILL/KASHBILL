import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { createDocumentSchema } from '@/lib/validators/documents';
import { createDocument } from '@/lib/documents/create';
import { isPro, getHistoryWindowDays } from '@/lib/auth/plan';

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
        if (result.reason === 'MISSING_COMPANY_FIELDS') {
          return jsonError('VALIDATION_ERROR', result.message, 422, {
            missingFields: result.missingFields,
          });
        }
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

