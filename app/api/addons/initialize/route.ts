import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { initNotchPayPayment } from '@/lib/payments/notchpay';
import { env } from '@/lib/env';
import { isPro } from '@/lib/auth/plan';
import { ADDON_PRICES } from '@/lib/addons/queries';

const schema = z.object({
  type: z.enum(['EXTRA_DEVICE', 'WHITE_LABEL']),
  method: z.enum(['mobile_money', 'card']),
  operatorCode: z.string().nullable().default(null),
});

function resolveNotchChannels(method: string, operatorCode: string | null): string[] {
  if (method === 'card') return ['card'];
  const MAP: Record<string, string> = {
    MTN_CM: 'cm.mtn', ORANGE_CM: 'cm.orange', MTN_CI: 'ci.mtn', ORANGE_CI: 'ci.orange',
    WAVE_CI: 'ci.wave', WAVE_SN: 'sn.wave', ORANGE_SN: 'sn.orange', FREE_SN: 'sn.free',
    AIRTEL_GA: 'ga.airtel', MOOV_GA: 'ga.moov', MTN_GH: 'gh.mtn', TELECEL_GH: 'gh.vodafone',
    AIRTELTIGO_GH: 'gh.airteltigo', MPESA_KE: 'ke.mpesa', AIRTEL_KE: 'ke.airtel',
    MTN_UG: 'ug.mtn', AIRTEL_UG: 'ug.airtel',
  };
  if (!operatorCode) return ['cm.orange', 'cm.mtn'];
  return [MAP[operatorCode] ?? 'cm.orange'];
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      if (!isPro(user)) return jsonError('FORBIDDEN', 'Add-ons réservés aux utilisateurs Pro', 403);
      const data = schema.parse(await req2.json());
      const price = ADDON_PRICES[data.type];

      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 86_400_000);

      // Subscription record pour tracer
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          source: 'NOTCH_PAY',
          startsAt: now,
          endsAt,
          amountXaf: price,
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
        callbackUrl: `${env.APP_URL}/fr/upgrade?addon=${subscription.id}`,
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
