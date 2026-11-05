import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { verifyNotchPaySignature } from '@/lib/payments/notchpay';
import { getClientIp, getUserAgent, writeAudit } from '@/lib/api/server';
import { PRO_DURATION_DAYS } from '@/lib/constants';

/**
 * Webhook Notch Pay.
 *
 * Règles :
 * - Vérification HMAC SHA-256 OBLIGATOIRE (header X-Notchpay-Signature)
 * - Idempotence : si la subscription est déjà marquée active, ne rien faire
 * - Ne jamais faire confiance au body : recalculer ce qui est nécessaire
 * - Répondre 200 rapidement (Notch Pay retente si timeout > 5s)
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-notchpay-signature');

    if (!verifyNotchPaySignature(rawBody, signature)) {
      await writeAudit({
        action: 'webhook_notchpay_invalid_signature',
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });
      return jsonError('FORBIDDEN', 'Signature invalide', 401);
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: { reference?: string; status?: string; amount?: number; currency?: string };
    };

    const eventType = event.event;
    const providerRef = event.data?.reference;
    const status = event.data?.status;
    const amount = event.data?.amount;

    if (!providerRef) {
      return jsonError('VALIDATION_ERROR', 'reference manquante', 400);
    }

    // Retrouver la subscription
    const subscription = await prisma.subscription.findFirst({
      where: { providerRef },
      include: { user: true },
    });

    if (!subscription) {
      // On accepte silencieusement (peut être un webhook de test ou une subscription supprimée)
      await writeAudit({
        action: 'webhook_notchpay_unknown_ref',
        meta: { providerRef, eventType },
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });
      return jsonOk({ received: true, ignored: 'unknown_ref' });
    }

    // Idempotence : si déjà active pour ce providerRef, on ignore
    const alreadyProcessed = await prisma.auditLog.findFirst({
      where: {
        action: 'payment_completed',
        meta: {
          path: ['providerRef'],
          equals: providerRef,
        },
      },
    });

    if (alreadyProcessed && eventType === 'payment.complete') {
      return jsonOk({ received: true, ignored: 'already_processed' });
    }

    if (eventType === 'payment.complete' && status === 'complete') {
      const now = new Date();
      const currentPro =
        subscription.user.proUntil && subscription.user.proUntil > now
          ? subscription.user.proUntil
          : now;
      const newPro = new Date(currentPro.getTime() + PRO_DURATION_DAYS * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { startsAt: now, endsAt: newPro },
        });
        await tx.user.update({
          where: { id: subscription.userId },
          data: { proUntil: newPro },
        });
      });

      await writeAudit({
        actorId: subscription.userId,
        targetId: subscription.userId,
        action: 'payment_completed',
        meta: { providerRef, amountXaf: amount, newProUntil: newPro.toISOString() },
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });

      return jsonOk({ received: true });
    }

    if (eventType === 'payment.failed' || eventType === 'payment.canceled') {
      await writeAudit({
        actorId: subscription.userId,
        targetId: subscription.userId,
        action: 'payment_failed',
        meta: { providerRef, status, eventType },
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      });
      return jsonOk({ received: true, status: 'failed' });
    }

    // Autres événements : on les log mais on ne fait rien
    await writeAudit({
      action: 'webhook_notchpay_unhandled',
      meta: { providerRef, eventType, status },
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    return jsonOk({ received: true, ignored: 'unhandled_event' });
  } catch (err) {
    return handleApiError(err);
  }
}

// Notch Pay peut envoyer des GET de vérification à la configuration
export async function GET(): Promise<Response> {
  return jsonOk({ status: 'ok', endpoint: 'notchpay-webhook' });
}

