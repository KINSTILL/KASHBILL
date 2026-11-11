import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { isCustomWhatsAppActive } from '@/lib/addons/queries';

const bodySchema = z.object({
  phone: z.string().min(1),
  message: z.string().max(2000).optional().default(''),
  pdfBase64: z.string().min(10),
  filename: z.string().min(1).max(120),
  locale: z.enum(['fr', 'en']).optional(),
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

/**
 * Construit le message encadré (Idée 1) indiquant clairement au destinataire :
 * - L'identité et le numéro de l'entreprise/émetteur (issu du profil utilisateur)
 * - Le fait que MyCashBill n'est qu'un outil technique utilisé par l'émetteur
 */
function buildAttributedCaption(params: {
  userMessage: string;
  senderName: string;
  senderPhone: string;
  isEn: boolean;
}): string {
  const { userMessage, senderName, senderPhone, isEn } = params;
  const trimmedMsg = userMessage.trim();

  const senderLabel =
    senderName && senderName !== senderPhone
      ? `${senderName} (${senderPhone})`
      : senderPhone;

  if (isEn) {
    const header = `📌 *Document sent on behalf of: ${senderLabel}*`;
    const footer = `_ℹ️ This document is automatically delivered via MyCashBill at the request of ${senderName || senderPhone}. MyCashBill is solely a technical invoicing tool: for any inquiry or payment, please contact the sender directly at ${senderPhone}._`;
    return trimmedMsg
      ? `${header}\n───────────────\n${trimmedMsg}\n───────────────\n${footer}`
      : `${header}\n───────────────\n${footer}`;
  }

  const header = `📌 *Document envoyé de la part de : ${senderLabel}*`;
  const footer = `_ℹ️ Ce document vous est transmis automatiquement via MyCashBill à la demande de ${senderName || senderPhone}. MyCashBill est uniquement un outil technique d'édition : pour toute question ou règlement, veuillez contacter directement l'émetteur au ${senderPhone}._`;
  return trimmedMsg
    ? `${header}\n───────────────\n${trimmedMsg}\n───────────────\n${footer}`
    : `${header}\n───────────────\n${footer}`;
}

async function fetchEvolutionInstances(
  evolutionUrl: string,
  evolutionKey: string
): Promise<Array<{ name: string; status: string }>> {
  try {
    const res = await fetch(`${evolutionUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: { apikey: evolutionKey },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => ({
        name: String(item?.name ?? item?.instance?.instanceName ?? item?.instanceName ?? ''),
        status: String(
          item?.connectionStatus ?? item?.instance?.status ?? item?.status ?? ''
        ),
      }))
      .filter((i) => i.name.length > 0);
  } catch {
    return [];
  }
}

async function resolveEvolutionInstance(
  evolutionUrl: string,
  evolutionKey: string,
  configuredInstance?: string
): Promise<string | null> {
  if (configuredInstance) return configuredInstance;
  const instances = await fetchEvolutionInstances(evolutionUrl, evolutionKey);
  if (instances.length === 0) return null;
  const openInst = instances.find((i) => i.status === 'open');
  return openInst?.name ?? instances[0]?.name ?? null;
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
        select: { id: true, number: true, locale: true, sentViaWhatsAppAt: true },
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

      const parsed = bodySchema.parse(await req2.json());
      const number = normalizeWhatsAppNumber(parsed.phone);
      if (!number) {
        return jsonError('VALIDATION_ERROR', 'Numéro WhatsApp invalide', 400);
      }

      const cleanBase64 = parsed.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const fileName = parsed.filename.endsWith('.pdf')
        ? parsed.filename
        : `${parsed.filename}.pdf`;

      const isEn = parsed.locale ? parsed.locale === 'en' : doc.locale === 'EN';
      const senderName =
        user.businessName?.trim() ||
        user.legalName?.trim() ||
        user.name?.trim() ||
        user.phone;

      // Vérifier si le Mode B (Add-on CUSTOM_WHATSAPP + instance dédiée `user_${user.id}` ouverte) est actif
      const hasCustomWhatsAppAddon = await isCustomWhatsAppActive(user.id);
      let usePersonalInstance = false;
      const personalInstanceName = `user_${user.id}`;

      if (hasCustomWhatsAppAddon) {
        const instances = await fetchEvolutionInstances(evolutionUrl, evolutionKey);
        const personalInst = instances.find(
          (i) => i.name === personalInstanceName && i.status === 'open'
        );
        if (personalInst) {
          usePersonalInstance = true;
        }
      }

      // En Mode B (propre numéro WhatsApp connecté), on envoie le message pur sans mention MyCashBill.
      // En Mode A (instance globale MyCashBill), on encadre avec l'Idée 1 (Nom de l'entreprise + clause outil technique).
      const finalCaption = usePersonalInstance
        ? parsed.message || ''
        : buildAttributedCaption({
            userMessage: parsed.message || '',
            senderName,
            senderPhone: user.phone,
            isEn,
          });

      const targetInstance = usePersonalInstance
        ? personalInstanceName
        : await resolveEvolutionInstance(evolutionUrl, evolutionKey, configuredInstance);

      if (!targetInstance) {
        return jsonOk({ sentDirect: false, reason: 'NO_INSTANCE_FOUND' });
      }

      let sendResult = await sendMediaViaEvolution({
        evolutionUrl,
        evolutionKey,
        instanceName: targetInstance,
        number,
        caption: finalCaption,
        cleanBase64,
        fileName,
      });

      // Si le nom d'instance configuré renvoie 404, on tente une auto-détection d'instance active
      if (!sendResult.ok && sendResult.status === 404 && !usePersonalInstance && configuredInstance) {
        const autoInstance = await resolveEvolutionInstance(evolutionUrl, evolutionKey, undefined);
        if (autoInstance && autoInstance !== configuredInstance) {
          sendResult = await sendMediaViaEvolution({
            evolutionUrl,
            evolutionKey,
            instanceName: autoInstance,
            number,
            caption: finalCaption,
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
        meta: { mode: usePersonalInstance ? 'CUSTOM_INSTANCE' : 'SHARED_INSTANCE' },
        ip,
        userAgent,
      });

      return jsonOk({ sentDirect: true, mode: usePersonalInstance ? 'custom' : 'shared' });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
