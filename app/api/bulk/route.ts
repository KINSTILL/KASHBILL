import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';
import { createDocument } from '@/lib/documents/create';
import { isPro } from '@/lib/auth/plan';

const schema = z.object({
  documentId: z.string().min(1),
  clientIds: z.array(z.string().min(1)).min(1).max(100),
  channel: z.enum(['EMAIL', 'WHATSAPP_LINKS']),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      if (!isPro(user)) return jsonError('PLAN_LIMIT_REACHED', 'Bulk réservé aux utilisateurs Pro.', 403);
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
      if (clients.length === 0) return jsonError('NOT_FOUND', 'Aucun client valide', 404);

      const job = await prisma.bulkJob.create({
        data: {
          userId: user.id,
          label: `Bulk ${new Date().toISOString().slice(0, 10)}`,
          docType: src.type,
          mode: src.mode,
          locale: src.locale,
          payload: src.payload as object,
          channel: data.channel,
          totalCount: clients.length,
          status: 'PROCESSING',
        },
      });

      const results: Array<{
        clientId: string;
        clientName: string;
        documentId?: string;
        number?: string;
        waUrl?: string;
        error?: string;
      }> = [];
      let success = 0;
      let fail = 0;

      for (const c of clients) {
        try {
          const r = await createDocument({
            user,
            clientId: c.id,
            type: src.type,
            mode: src.mode,
            locale: src.locale,
            payload: src.payload as Parameters<typeof createDocument>[0]['payload'],
          });
          if (!r.ok) {
            await prisma.bulkJobItem.create({
              data: { jobId: job.id, clientId: c.id, status: 'FAILED', error: r.reason },
            });
            results.push({ clientId: c.id, clientName: c.name, error: r.reason });
            fail++;
            continue;
          }
          let waUrl: string | null = null;
          if (data.channel === 'WHATSAPP_LINKS' && c.phone) {
            const digits = c.phone.replace(/\D/g, '').replace(/^0+/, '');
            const intl = digits.startsWith('237') ? digits : `237${digits}`;
            waUrl = `https://wa.me/${intl}?text=${encodeURIComponent(`Bonjour ${c.name}, voici votre document ${r.number}`)}`;
          }
          await prisma.bulkJobItem.create({
            data: { jobId: job.id, clientId: c.id, documentId: r.documentId, waUrl, status: 'SUCCESS' },
          });
          results.push({
            clientId: c.id,
            clientName: c.name,
            documentId: r.documentId,
            number: r.number,
            waUrl: waUrl ?? undefined,
          });
          success++;
        } catch (e) {
          await prisma.bulkJobItem.create({
            data: {
              jobId: job.id,
              clientId: c.id,
              status: 'FAILED',
              error: e instanceof Error ? e.message : 'unknown',
            },
          });
          results.push({ clientId: c.id, clientName: c.name, error: 'exception' });
          fail++;
        }
      }

      await prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          successCount: success,
          failCount: fail,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return jsonOk({ jobId: job.id, total: clients.length, success, fail, channel: data.channel, results });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

