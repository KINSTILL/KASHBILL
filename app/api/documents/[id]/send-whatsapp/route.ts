import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { renderDocumentPdf } from '@/lib/pdf/render-document';
import { sendDocumentViaWhatsApp } from '@/lib/whatsapp/send';
import { loadPdfDocument } from '@/lib/documents/load-pdf-document';
import { buildDocumentXml } from '@/lib/einvoice/ubl';

const bodySchema = z.object({
  phone: z.string().min(1),
  message: z.string().max(2000).optional().default(''),
  filename: z.string().min(1).max(120).optional(),
  locale: z.enum(['fr', 'en']).optional(),
  mode: z.enum(['shared', 'personal']).optional(),
  includeXml: z.boolean().optional(),
  /** Code pays ISO-2 du destinataire, choisi par l'utilisateur (ex. FR, CI, CM). */
  countryCode: z.string().length(2).optional(),
});

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
      if (!doc) return jsonError('NOT_FOUND', 'Document introuvable', 404);

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

      const parsed = bodySchema.parse(await req2.json());
      const rendered = await renderDocumentPdf(doc.id, user.id);
      if (!rendered) return jsonError('NOT_FOUND', 'Document introuvable', 404);

      const isEn = parsed.locale ? parsed.locale === 'en' : doc.locale === 'EN';
      let xml: { content: string; fileName: string } | undefined;
      if (parsed.includeXml) {
        const loaded = await loadPdfDocument(doc.id, user.id);
        if (loaded) xml = { content: buildDocumentXml(loaded.pdfDoc), fileName: `${doc.number}.xml` };
      }
      const result = await sendDocumentViaWhatsApp({
        user,
        phone: parsed.phone,
        message: parsed.message,
        pdf: rendered.buffer,
        fileName: parsed.filename ?? `${doc.number}.pdf`,
        isEn,
        mode: parsed.mode,
        countryCode: parsed.countryCode,
        xml,
      });

      if (!result.ok) {
        if (result.reason === 'INVALID_NUMBER') {
          return jsonError('VALIDATION_ERROR', 'Numéro WhatsApp invalide. Vérifiez l’indicatif et le numéro.', 400);
        }
        if (result.reason === 'GATEWAY_ERROR') {
          // 404/400 renvoyés par Evolution = numéro inexistant sur WhatsApp ou mal formé.
          const noWhatsApp = result.gatewayStatus === 400 || result.gatewayStatus === 404;
          return jsonOk({
            sentDirect: false,
            reason: result.reason,
            gatewayStatus: result.gatewayStatus,
            code: noWhatsApp ? 'NO_WHATSAPP' : 'GATEWAY_ERROR',
          });
        }
        if (result.reason === 'PERSONAL_NOT_CONNECTED') {
          return jsonError(
            'WHATSAPP_NOT_CONNECTED',
            "Votre numéro WhatsApp personnel n'est pas connecté. Reconnectez-le dans Paramètres › WhatsApp.",
            409
          );
        }
        return jsonOk({ sentDirect: false, reason: result.reason, gatewayStatus: result.gatewayStatus });
      }

      if (!doc.sentViaWhatsAppAt) {
        await prisma.document.update({ where: { id: doc.id }, data: { sentViaWhatsAppAt: new Date() } });
      }
      try {
        const { tryActivateReferral } = await import('@/lib/referral/activate');
        await tryActivateReferral(user.id, ip, deviceId);
      } catch {}

      await writeAudit({
        actorId: user.id,
        targetId: doc.id,
        action: 'document_sent_whatsapp',
        meta: { mode: result.mode === 'custom' ? 'CUSTOM_INSTANCE' : 'SHARED_INSTANCE' },
        ip,
        userAgent,
      });

      return jsonOk({ sentDirect: true, mode: result.mode, xmlSent: result.xmlSent });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
