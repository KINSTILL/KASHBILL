import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { initNotchPayPayment } from '@/lib/payments/notchpay';
import { PRO_PRICE_FCFA, PRO_DURATION_DAYS } from '@/lib/constants';
import { env } from '@/lib/env';
import { isPro } from '@/lib/auth/plan';

const schema = z.object({
  method: z.enum(['mobile_money', 'card']),
  operatorCode: z.string().nullable().default(null),
});

function resolveNotchChannels(
  method: 'mobile_money' | 'card',
  operatorCode: string | null
): string[] {
  if (method === 'card') return ['card'];
  const MAP: Record<string, string> = {
    MTN_CM: 'cm.mtn', ORANGE_CM: 'cm.orange',
    MTN_CI: 'ci.mtn', ORANGE_CI: 'ci.orange', WAVE_CI: 'ci.wave',
    WAVE_SN: 'sn.wave', ORANGE_SN: 'sn.orange', FREE_SN: 'sn.free',
    AIRTEL_GA: 'ga.airtel', MOOV_GA: 'ga.moov',
    MTN_GH: 'gh.mtn', TELECEL_GH: 'gh.vodafone', AIRTELTIGO_GH: 'gh.airteltigo',
    MPESA_KE: 'ke.mpesa', AIRTEL_KE: 'ke.airtel',
    MTN_UG: 'ug.mtn', AIRTEL_UG: 'ug.airtel',
  };
  if (!operatorCode) return ['cm.orange', 'cm.mtn'];
  return [MAP[operatorCode] ?? 'cm.orange'];
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      // Vérifie que le user n'est pas déjà Pro loin dans le futur
      const now = new Date();
      if (
        user.proUntil &&
        isPro(user) &&
        user.proUntil > new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      ) {
        return jsonError('CONFLICT', 'Vous avez déjà plus de 60 jours de Pro actifs', 409);
      }

      const body = await req2.json().catch(() => ({}));
      const data = schema.parse(body);

      // Créer la Subscription en PENDING (id utilisé comme référence Notch Pay)
      // Ligne en attente : endsAt = startsAt = maintenant, donc non active.
      // Le webhook de paiement confirmé fixe les vraies dates.
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          source: 'NOTCH_PAY',
          startsAt: now,
          endsAt: now,
          amountXaf: PRO_PRICE_FCFA,
          providerRef: null, // rempli plus tard par le webhook
          consumerWithdrawalWaiver:
            user.accountType === 'CONSUMER' && Boolean(user.consumerWaiverAcceptedAt),
          consumerWithdrawalWaivedAt:
            user.accountType === 'CONSUMER' && user.consumerWaiverAcceptedAt
              ? user.consumerWaiverAcceptedAt
              : null,
        },
      });

      const reference = `MCB-${subscription.id.slice(-12).toUpperCase()}`;

      const result = await initNotchPayPayment({
        amountXaf: PRO_PRICE_FCFA,
        currency: 'XAF',
        reference,
        description: `MyCashBill Pro — 30 jours`,
        customerPhone: user.phone,
        customerName: user.name ?? user.businessName ?? 'Utilisateur',
        callbackUrl: `${env.APP_URL}/fr/upgrade?ref=${reference}`,
        channels: resolveNotchChannels(data.method, data.operatorCode),
      });

      if (!result.ok) {
        // Supprimer la subscription fantôme
        await prisma.subscription.delete({ where: { id: subscription.id } });
        await writeAudit({
          actorId: user.id,
          targetId: user.id,
          action: 'payment_init_failed',
          meta: {
            reason: result.reason,
            details: typeof result.details === 'object' ? JSON.stringify(result.details) : String(result.details),
          },
          ip,
          userAgent,
        });
        return jsonError('INTERNAL', "Erreur lors de l'initialisation du paiement", 500);
      }

      // Mettre à jour la subscription avec le providerRef
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { providerRef: result.providerRef },
      });

      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'payment_init_success',
        meta: { reference, providerRef: result.providerRef, amountXaf: PRO_PRICE_FCFA },
        ip,
        userAgent,
      });

      return jsonOk({
        reference,
        authorizationUrl: result.authorizationUrl,
        amountXaf: PRO_PRICE_FCFA,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

