import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';
import { createDocument } from '@/lib/documents/create';
import { isPro } from '@/lib/auth/plan';
import { renderDocumentPdf } from '@/lib/pdf/render-document';
import { sendDocumentViaWhatsApp } from '@/lib/whatsapp/send';
import { loadPdfDocument } from '@/lib/documents/load-pdf-document';
import { buildDocumentXml } from '@/lib/einvoice/ubl';

// Envoi en masse : WhatsApp uniquement, depuis l'instance MyCashBill (ou le numéro personnel
// si l'add-on est actif). Le destinataire est choisi explicitement par l'utilisateur.
const MAX_RECIPIENTS = 30;
const DELAY_BETWEEN_MESSAGES_MS = 1500; // cadence raisonnable pour limiter les blocages WhatsApp

const schema = z.object({
  documentId: z.string().min(1),
  clientIds: z.array(z.string().min(1)).min(1).max(MAX_RECIPIENTS),
  message: z.string().max(1000).optional().default(''),
  includeXml: z.boolean().optional(),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      if (!isPro(user)) {
        return jsonError('PLAN_LIMIT_REACHED', 'Envoi en masse réservé aux comptes Pro.', 403);
      }
      const data = schema.parse(await req2.json());

      const src = await prisma.document.findFirst({
        where: { id: data.documentId, userId: user.id },
        select: { type: true, mode: true, locale: true, payload: true },
      });
      if (!src) return jsonError('NOT_FOUND', 'Document source introuvable', 404);

      const clients = await prisma.client.findMany({
        where: { id: { in: data.clientIds }, userId: user.id },
        select: { id: true, name: true, phone: true },
      });
      const withPhone = clients.filter((c) => c.phone && c.phone.trim().length > 0);
      if (withPhone.length === 0) {
        return jsonError('VALIDATION_ERROR', 'Aucun destinataire avec un numéro WhatsApp.', 400);
      }

      const job = await prisma.bulkJob.create({
        data: {
          userId: user.id,
          label: `Envoi en masse ${new Date().toISOString().slice(0, 10)}`,
          docType: src.type,
          mode: src.mode,
          locale: src.locale,
          payload: src.payload as object,
          channel: 'WHATSAPP',
          totalCount: withPhone.length,
          status: 'PROCESSING',
        },
      });

      const results: Array<{
        clientId: string;
        clientName: string;
        status: 'SENT' | 'FAILED';
        number?: string;
        error?: string;
      }> = [];
      let success = 0;
      let fail = 0;
      let xmlFail = 0;
      let aborted: string | null = null;

      for (let i = 0; i < withPhone.length; i++) {
        const c = withPhone[i]!;
        try {
          const created = await createDocument({
            user,
            clientId: c.id,
            type: src.type,
            mode: src.mode,
            locale: src.locale,
            payload: src.payload as Parameters<typeof createDocument>[0]['payload'],
          });
          if (!created.ok) throw new Error(created.reason);

          const rendered = await renderDocumentPdf(created.documentId, user.id);
          if (!rendered) throw new Error('PDF_RENDER_FAILED');

          const isEn = src.locale === 'EN';
          const greeting = isEn ? `Hello ${c.name}, ` : `Bonjour ${c.name}, `;
          const body = src.locale === 'EN'
            ? `${greeting}please find your document ${created.number}.`
            : `${greeting}voici votre document ${created.number}.`;
          const message = data.message.trim() ? `${body}\n\n${data.message.trim()}` : body;

          // XML facultatif : généré à partir du document créé pour ce destinataire.
          let xml: { content: string; fileName: string } | undefined;
          if (data.includeXml) {
            const loaded = await loadPdfDocument(created.documentId, user.id);
            if (loaded) xml = { content: buildDocumentXml(loaded.pdfDoc), fileName: `${created.number}.xml` };
          }

          const sent = await sendDocumentViaWhatsApp({
            user,
            phone: c.phone!,
            message,
            pdf: rendered.buffer,
            fileName: `${created.number}.pdf`,
            isEn,
            xml,
          });

          if (!sent.ok) {
            // Configuration ou numéro personnel déconnecté : inutile de continuer
            if (sent.reason === 'NOT_CONFIGURED' || sent.reason === 'PERSONAL_NOT_CONNECTED') {
              aborted = sent.reason;
            }
            throw new Error(sent.reason);
          }

          if (sent.xmlSent === false) xmlFail++;

          await prisma.bulkJobItem.create({
            data: { jobId: job.id, clientId: c.id, documentId: created.documentId, status: 'SUCCESS' },
          });
          results.push({ clientId: c.id, clientName: c.name, status: 'SENT', number: created.number });
          success++;
        } catch (e) {
          const error = e instanceof Error ? e.message : 'unknown';
          await prisma.bulkJobItem.create({
            data: { jobId: job.id, clientId: c.id, status: 'FAILED', error },
          });
          results.push({ clientId: c.id, clientName: c.name, status: 'FAILED', error });
          fail++;
          if (aborted) break;
        }

        if (i < withPhone.length - 1) await sleep(DELAY_BETWEEN_MESSAGES_MS);
      }

      await prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          successCount: success,
          failCount: fail,
          status: aborted ? 'FAILED' : 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return jsonOk({
        jobId: job.id,
        total: withPhone.length,
        success,
        fail,
        aborted,
        xmlFail,
        results,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
