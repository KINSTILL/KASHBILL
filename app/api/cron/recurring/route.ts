import type { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { env } from '@/lib/env';
import { createDocument } from '@/lib/documents/create';
import { getResendClient, EMAIL_FROM } from '@/lib/email/client';
import { buildDocumentEmail } from '@/lib/email/templates/document-email';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { formatXaf } from '@/lib/pdf/shared/format';
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
    const due = await prisma.recurringSchedule.findMany({
      where: { isPaused: false, nextRunAt: { lte: now } },
      include: { user: true, client: true },
      take: 50,
    });
    let processed = 0, failed = 0, emailed = 0;

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

        // EMAIL AUTO uniquement (jamais WhatsApp)
        if (s.autoSendEmail && s.client?.email) {
          try {
            const doc = await prisma.document.findUnique({
              where: { id: result.documentId },
              include: { verification: true },
            });
            if (doc?.pdfPath) {
              const pdfBuffer = await readFile(path.join(process.cwd(), doc.pdfPath));
              const cfg = DOC_TYPE_CONFIG[doc.type];
              const p = doc.payload as { total?: number };
              const tpl = buildDocumentEmail({
                locale: s.locale === 'FR' ? 'fr' : 'en',
                senderName: s.user.businessName ?? s.user.name ?? 'MyCashBill',
                docType: cfg.label,
                docNumber: doc.number,
                clientName: s.client.name,
                totalFormatted: formatXaf(p.total ?? 0),
                customMessage: null,
                verificationUrl: doc.verification?.publicToken
                  ? `${env.APP_URL}/verify/${doc.verification.publicToken}`
                  : null,
              });
              await getResendClient().emails.send({
                from: EMAIL_FROM,
                to: [s.client.email],
                subject: tpl.subject,
                html: tpl.html,
                text: tpl.text,
                attachments: [{ filename: `${doc.number}.pdf`, content: pdfBuffer }],
              });
              emailed++;
            }
          } catch {
            /* non-blocking */
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
    return jsonOk({ processed, failed, emailed, total: due.length });
  } catch (err) {
    return handleApiError(err);
  }
}

