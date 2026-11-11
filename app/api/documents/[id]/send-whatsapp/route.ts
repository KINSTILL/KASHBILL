import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';

const bodySchema = z.object({
  phone: z.string().min(1),
  message: z.string().max(2000).optional().default(''),
  pdfBase64: z.string().min(10),
  filename: z.string().min(1).max(120),
});

function normalizeWhatsAppNumber(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
    return trimmed.replace(/^\+|^00/, '').replace(/\D/g, '');
  }
  const digits = trimmed.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  return digits.startsWith('237') || digits.length > 9 ? digits : `237${digits}`;
}

async function resolveEvolutionInstance(
  evolutionUrl: string,
  evolutionKey: string,
  configuredInstance?: string
): Promise<string | null> {
  if (configuredInstance) return configuredInstance;

  try {
    const res = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { apikey: evolutionKey },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Evolution API v2: item.name & item.connectionStatus === 'open'
    // Evolution API v1: item.instance.instanceName & item.instance.status === 'open'
    for (const item of data) {
      const name = item?.name ?? item?.instance?.instanceName ?? item?.instanceName;
      const status = item?.connectionStatus ?? item?.instance?.status ?? item?.status;
      if (name && status === 'open') {
        return String(name);
      }
    }

    const first = data[0];
    const fallbackName = first?.name ?? first?.instance?.instanceName ?? first?.instanceName;
    return fallbackName ? String(fallbackName) : null;
  } catch {
    return null;
  }
}

async function sendMediaViaEvolution(params: {
  evolutionUrl: string;
  evolutionKey: string;
  instanceName: string;
  number: string;
  caption: string;
  cleanBase64: string;
  fileName: string;
}): Promise<{ ok: boolean; status: number; details?: string }> {
  const { evolutionUrl, evolutionKey, instanceName, number, caption, cleanBase64, fileName } =
    params;
  const endpoint = `${evolutionUrl}/message/sendMedia/${encodeURIComponent(instanceName)}`;

  // Format Evolution API v2 (standard sur Coolify)
  const v2Res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: evolutionKey,
    },
    body: JSON.stringify({
      number,
      mediatype: 'document',
      mimetype: 'application/pdf',
      caption,
      media: cleanBase64,
      fileName,
    }),
  });

  if (v2Res.ok) {
    return { ok: true, status: v2Res.status };
  }

  const v2ErrText = await v2Res.text().catch(() => '');

  // Si 400 (format v1 avec mediaMessage), on tente le format Evolution API v1 en fallback
  if (v2Res.status === 400) {
    const v1Res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: evolutionKey,
      },
      body: JSON.stringify({
        number,
        options: { delay: 500, presence: 'composing' },
        mediaMessage: {
          mediatype: 'document',
          fileName,
          caption,
          media: cleanBase64,
        },
      }),
    });

    if (v1Res.ok) {
      return { ok: true, status: v1Res.status };
    }
    const v1ErrText = await v1Res.text().catch(() => '');
    return { ok: false, status: v1Res.status, details: v1ErrText || v2ErrText };
  }

  return { ok: false, status: v2Res.status, details: v2ErrText };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, deviceId, ip, userAgent }) => {
      const { id } = await context.params;
      const doc = await prisma.document.findFirst({
        where: { id, userId: user.id },
        select: { id: true, number: true, sentViaWhatsAppAt: true },
      });

      if (!doc) {
        return jsonError('NOT_FOUND', 'Document introuvable', 404);
      }

      const { checkWhatsAppQuota } = await import('@/lib/quota/check');
      const quota = await checkWhatsAppQuota(user);
      if (quota.reached) {
        return jsonError(
          'PLAN_LIMIT_REACHED',
          `Limite gratuite atteinte (${quota.limit} envois WhatsApp/mois). Passez Pro pour un envoi illimité.`,
          403,
          { used: quota.used, limit: quota.limit }
        );
      }

      const evolutionUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, '');
      const evolutionKey = (
        process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY
      )?.trim();
      const configuredInstance = process.env.EVOLUTION_INSTANCE_NAME?.trim();

      if (!evolutionUrl || !evolutionKey) {
        return jsonOk({ sentDirect: false, reason: 'NOT_CONFIGURED' });
      }

      const evolutionInstance = await resolveEvolutionInstance(
        evolutionUrl,
        evolutionKey,
        configuredInstance
      );

      if (!evolutionInstance) {
        return jsonOk({ sentDirect: false, reason: 'NO_INSTANCE_FOUND' });
      }

      const parsed = bodySchema.parse(await req2.json());
      const number = normalizeWhatsAppNumber(parsed.phone);
      if (!number) {
        return jsonError('VALIDATION_ERROR', 'Numéro WhatsApp invalide', 400);
      }

      const cleanBase64 = parsed.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const fileName = parsed.filename.endsWith('.pdf')
        ? parsed.filename
        : `${parsed.filename}.pdf`;

      let sendResult = await sendMediaViaEvolution({
        evolutionUrl,
        evolutionKey,
        instanceName: evolutionInstance,
        number,
        caption: parsed.message || '',
        cleanBase64,
        fileName,
      });

      // Si le nom d'instance configuré renvoie 404, on tente une auto-détection d'instance active
      if (!sendResult.ok && sendResult.status === 404 && configuredInstance) {
        const autoInstance = await resolveEvolutionInstance(evolutionUrl, evolutionKey, undefined);
        if (autoInstance && autoInstance !== configuredInstance) {
          sendResult = await sendMediaViaEvolution({
            evolutionUrl,
            evolutionKey,
            instanceName: autoInstance,
            number,
            caption: parsed.message || '',
            cleanBase64,
            fileName,
          });
        }
      }

      if (!sendResult.ok) {
        console.warn(
          '[EVOLUTION API] Échec envoi direct PDF:',
          sendResult.status,
          sendResult.details?.slice(0, 300)
        );
        return jsonOk({
          sentDirect: false,
          reason: 'GATEWAY_ERROR',
          gatewayStatus: sendResult.status,
        });
      }

      if (!doc.sentViaWhatsAppAt) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { sentViaWhatsAppAt: new Date() },
        });
      }

      try {
        const { tryActivateReferral } = await import('@/lib/referral/activate');
        await tryActivateReferral(user.id, ip, deviceId);
      } catch {}

      await writeAudit({
        actorId: user.id,
        targetId: doc.id,
        action: 'document_sent_whatsapp',
        ip,
        userAgent,
      });

      return jsonOk({ sentDirect: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
