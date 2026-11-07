import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

const schema = z.object({
  documentId: z.string().min(1),
  label: z.string().min(1).max(120),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  autoSendEmail: z.boolean().default(false),
});

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const schedules = await prisma.recurringSchedule.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { name: true } }, _count: { select: { runs: true } } },
      });
      return jsonOk({ schedules });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const data = schema.parse(await req2.json());
      const doc = await prisma.document.findFirst({
        where: { id: data.documentId, userId: user.id },
        select: { type: true, mode: true, locale: true, payload: true, clientId: true },
      });
      if (!doc) return jsonError('NOT_FOUND', 'Document introuvable', 404);
      const nextRunAt = new Date();
      nextRunAt.setDate(nextRunAt.getDate() + 1);
      const schedule = await prisma.recurringSchedule.create({
        data: {
          userId: user.id,
          label: data.label,
          docType: doc.type,
          mode: doc.mode,
          locale: doc.locale,
          payload: doc.payload as object,
          clientId: doc.clientId,
          frequency: data.frequency,
          autoSendEmail: data.autoSendEmail,
          nextRunAt,
        },
      });
      return jsonOk({ schedule }, 201);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

