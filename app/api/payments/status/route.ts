import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

const querySchema = z.object({ ref: z.string().min(3).max(64) });

/**
 * Vérifie l'état précis d'une transaction de paiement spécifique.
 * Permet à la page de retour de savoir sans ambiguïté si CETTE transaction
 * a été validée par Notch Pay, si elle a échoué, ou si elle est en attente.
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const { ref } = querySchema.parse({
        ref: new URL(req2.url).searchParams.get('ref') ?? '',
      });

      // Retrouve la souscription liée à cette référence précise
      const sub = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          OR: [
            { id: ref },
            { providerRef: ref },
            ...(ref.startsWith('MCB-') || ref.startsWith('CB-ADD-')
              ? [
                  {
                    id: {
                      endsWith: ref.replace(/^(MCB-|CB-ADD-)/, '').toLowerCase(),
                    },
                  },
                ]
              : []),
          ],
        },
        include: {
          invoice: { select: { number: true, id: true } },
        },
      });

      if (!sub) {
        return jsonError('NOT_FOUND', 'Transaction introuvable', 404);
      }

      // Une souscription validée par le webhook a des dates effectives : endsAt > startsAt
      const isConfirmed =
        sub.endsAt.getTime() > sub.startsAt.getTime() && sub.endsAt.getTime() > Date.now();

      // Vérifier si un échec a été enregistré dans l'audit log pour cette référence
      const failedAudit = await prisma.auditLog.findFirst({
        where: {
          actorId: user.id,
          action: 'payment_failed',
          meta: {
            path: ['providerRef'],
            equals: ref,
          },
        },
      });

      if (isConfirmed) {
        return jsonOk({
          status: 'COMPLETED',
          endsAt: sub.endsAt.toISOString(),
          amountXaf: sub.amountXaf,
          addOnType: sub.addOnType,
          invoiceNumber: sub.invoice?.number ?? null,
        });
      }

      if (failedAudit) {
        return jsonOk({
          status: 'FAILED',
          amountXaf: sub.amountXaf,
        });
      }

      return jsonOk({
        status: 'PENDING',
        amountXaf: sub.amountXaf,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
