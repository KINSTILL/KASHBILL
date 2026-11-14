import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { initNotchPayPayment } from '@/lib/payments/notchpay';
import { env } from '@/lib/env';
import { ADDON_PRICES, hasPaidProSubscription } from '@/lib/addons/queries';

const schema = z.object({
  type: z.enum(['EXTRA_DEVICE', 'CUSTOM_WHATSAPP', 'WHITE_LABEL']),
  method: z.enum(['mobile_money', 'card', 'auto']).optional().default('auto'),
  operatorCode: z.string().nullable().optional().default(null),
  locale: z.enum(['fr', 'en']).optional().default('fr'),
});

function resolveNotchChannels(method: string, operatorCode: string | null): string[] | undefined {
  if (method === 'auto' && !operatorCode) return undefined;
  if (method === 'card') return ['card'];
  const MAP: Record<string, string> = {
    MTN_CM: 'cm.mtn', ORANGE_CM: 'cm.orange', MTN_CI: 'ci.mtn', ORANGE_CI: 'ci.orange',
    WAVE_CI: 'ci.wave', WAVE_SN: 'sn.wave', ORANGE_SN: 'sn.orange', FREE_SN: 'sn.free',
    AIRTEL_GA: 'ga.airtel', MOOV_GA: 'ga.moov', MTN_GH: 'gh.mtn', TELECEL_GH: 'gh.vodafone',
    AIRTELTIGO_GH: 'gh.airteltigo', MPESA_KE: 'ke.mpesa', AIRTEL_KE: 'ke.airtel',
    MTN_UG: 'ug.mtn', AIRTEL_UG: 'ug.airtel',
  };
  if (!operatorCode) return undefined;
  return [MAP[operatorCode] ?? 'cm.orange'];
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      const eligible = await hasPaidProSubscription(user.id);
      if (!eligible) {
        return jsonError(
          'FORBIDDEN',
          "Les extensions nécessitent un abonnement Pro payant actif. Les comptes gratuits ou en période d'essai ne peuvent pas souscrire aux extensions.",
          403
        );
      }
      const data = schema.parse(await req2.json());
      const price = ADDON_PRICES[data.type];

      const now = new Date();

      // Subscription record pour tracer
      // Ligne en attente : endsAt = startsAt = maintenant, donc non active.
      // Le webhook de paiement confirmé fixe les vraies dates.
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          source: 'NOTCH_PAY',
          startsAt: now,
          endsAt: now,
          amountXaf: price,
          addOnType: data.type,
        },
      });

      const reference = `CB-ADD-${subscription.id.slice(-10).toUpperCase()}`;

      const result = await initNotchPayPayment({
        amountXaf: price,
        currency: 'XAF',
        reference,
        description: `MyCashBill Add-on ${data.type} — 30 jours`,
        customerPhone: user.phone,
        customerName: user.name ?? user.businessName ?? 'Utilisateur',
        // Numéro personnel : la page de configuration du numéro suit le paiement
        callbackUrl: `${env.APP_URL}/${data.locale}/${data.type === 'CUSTOM_WHATSAPP' ? 'upgrade/whatsapp' : 'upgrade/merci'}?addon=${subscription.id}`,
        channels: resolveNotchChannels(data.method, data.operatorCode),
      });

      if (!result.ok) {
        await prisma.subscription.delete({ where: { id: subscription.id } });
        return jsonError('INTERNAL', 'Erreur initialisation paiement', 500);
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { providerRef: result.providerRef },
      });

      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'addon_init',
        meta: { type: data.type, reference },
        ip,
        userAgent,
      });

      return jsonOk({ authorizationUrl: result.authorizationUrl, reference });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

