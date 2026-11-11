import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { env } from '@/lib/env';
import { createDocument } from '@/lib/documents/create';
import { renderDocumentPdf } from '@/lib/pdf/render-document';
import { sendDocumentViaWhatsApp } from '@/lib/whatsapp/send';
import type { DocumentPayloadInput } from '@/lib/validators/documents';
import type { RecurringFrequency } from '@prisma/client';

function computeNextRun(f: RecurringFrequency, from: Date): Date {
  const d = new Date(from);
  if (f === 'DAILY') d.setDate(d.getDate() + 1);
  else if (f === 'WEEKLY') d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    if (req.headers.get('x-cron-secret') !== env.CRON_SECRET) {
      return jsonError('UNAUTHORIZED', 'Invalid cron secret', 401);
    }
    const now = new Date();
    // Programmation réservée au Pro : sans abonnement actif, rien ne s'exécute.
    // Les programmations reprennent au renouvellement.
    const due = await prisma.recurringSchedule.findMany({
      where: {
        isPaused: false,
        nextRunAt: { lte: now },
        user: { proUntil: { gt: now } },
      },
      include: { user: true, client: true },
      take: 50,
    });
    let processed = 0, failed = 0, sent = 0;

    for (const s of due) {
      try {
        const result = await createDocument({
          user: s.user,
          clientId: s.clientId,
          type: s.docType,
          mode: s.mode,
          locale: s.locale,
          payload: s.payload as unknown as DocumentPayloadInput,
        });
        if (!result.ok) {
          await prisma.recurringRun.create({
            data: { scheduleId: s.id, status: 'FAILED', error: result.reason },
          });
          await prisma.recurringSchedule.update({
            where: { id: s.id },
            data: { nextRunAt: computeNextRun(s.frequency, now) },
          });
          failed++;
          continue;
        }
        await prisma.recurringRun.create({
          data: { scheduleId: s.id, documentId: result.documentId, status: 'SUCCESS' },
        });

        // Envoi automatique : WhatsApp uniquement, depuis l'instance MyCashBill (ou le numéro personnel)
        if (s.autoSendWhatsApp && s.client?.phone) {
          try {
            const rendered = await renderDocumentPdf(result.documentId, s.userId);
            if (rendered) {
              const isEn = s.locale === 'EN';
              const message = isEn
                ? `Hello ${s.client.name}, please find your document ${result.number}.`
                : `Bonjour ${s.client.name}, voici votre document ${result.number}.`;
              const r = await sendDocumentViaWhatsApp({
                user: s.user,
                phone: s.client.phone,
                message,
                pdf: rendered.buffer,
                fileName: `${result.number}.pdf`,
                isEn,
              });
              if (r.ok) sent++;
            }
          } catch {
            /* non bloquant : le document est créé, l'envoi est tracé comme non effectué */
          }
        }

        await prisma.recurringSchedule.update({
          where: { id: s.id },
          data: { lastRunAt: now, nextRunAt: computeNextRun(s.frequency, now) },
        });
        processed++;
      } catch (e) {
        await prisma.recurringRun.create({
          data: { scheduleId: s.id, status: 'FAILED', error: e instanceof Error ? e.message : 'unknown' },
        });
        await prisma.recurringSchedule.update({
          where: { id: s.id },
          data: { nextRunAt: computeNextRun(s.frequency, now) },
        });
        failed++;
      }
    }
    return jsonOk({ processed, failed, sent, total: due.length });
  } catch (err) {
    return handleApiError(err);
  }
}
