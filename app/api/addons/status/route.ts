import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

const querySchema = z.object({ subscriptionId: z.string().min(1).max(64) });

/**
 * État d'un achat d'add-on : prêt quand l'add-on est activé ET la facture émise.
 * Utilisé par la page de confirmation après le retour du paiement.
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const { subscriptionId } = querySchema.parse({
        subscriptionId: new URL(req2.url).searchParams.get('subscriptionId') ?? '',
      });

      const subscription = await prisma.subscription.findFirst({
        where: { id: subscriptionId, userId: user.id },
        select: { id: true },
      });
      if (!subscription) return jsonError('NOT_FOUND', 'Achat introuvable', 404);

      const [addOn, invoice] = await Promise.all([
        prisma.userAddOn.findFirst({
          where: { subscriptionId },
          select: { type: true, endsAt: true },
        }),
        prisma.subscriptionInvoice.findUnique({
          where: { subscriptionId },
          select: { number: true },
        }),
      ]);

      return jsonOk({
        ready: Boolean(addOn && invoice),
        addOnType: addOn?.type ?? null,
        endsAt: addOn?.endsAt ?? null,
        invoiceNumber: invoice?.number ?? null,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
