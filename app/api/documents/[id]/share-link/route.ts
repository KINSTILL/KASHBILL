import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { buildDocumentShareUrl, buildDocumentXmlShareUrl, signDocumentShareToken } from '@/lib/share/pdf-token';
import { renderDocumentPdf } from '@/lib/pdf/render-document';

// Aucune donnée client : le PDF est généré par le serveur.
// includeXml : renvoie aussi le lien de téléchargement du XML (même jeton).
const bodySchema = z.object({ includeXml: z.boolean().optional() }).passthrough();

// Aucun export hors handlers : Next.js rejette les autres exports dans un route.ts.
// La signature du jeton vit dans @/lib/share/pdf-token.
//
// Le PDF n'est plus écrit sur le disque : la route publique le régénère à la volée.
// On rend quand même le PDF ici pour valider qu'il est générable avant de renvoyer le lien.

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

      const parsedBody = bodySchema.parse(await req2.json());
      // Vérifie que le PDF est générable avant de promettre un lien valable.
      const rendered = await renderDocumentPdf(doc.id, user.id);
      if (!rendered) return jsonError('NOT_FOUND', 'Document introuvable', 404);

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
        meta: { mode: 'DIRECT_DOWNLOAD_LINK' },
        ip,
        userAgent,
      });

      const token = signDocumentShareToken(doc.id);
      const origin = req2.nextUrl.origin || env.APP_URL.replace(/\/+$/, '');
      const downloadUrl = buildDocumentShareUrl(origin, doc.id, token);
      const xmlUrl = parsedBody.includeXml ? buildDocumentXmlShareUrl(origin, doc.id, token) : undefined;

      return jsonOk({ downloadUrl, xmlUrl });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
