import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';
import { ANNOUNCEMENT_AUDIT_ACTION, getActiveAnnouncement } from '@/lib/announcements';

const postSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('publish'),
    title: z.string().trim().min(1).max(140),
    message: z.string().trim().min(1).max(2000),
    endsAt: z.string().min(1),
  }),
  z.object({
    action: z.literal('clear'),
  }),
]);

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_stats', async () => {
      const announcement = await getActiveAnnouncement();
      return jsonOk({ announcement });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_stats', async (req2, { user }) => {
      const body = postSchema.parse(await req2.json());

      if (body.action === 'clear') {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: ANNOUNCEMENT_AUDIT_ACTION,
            meta: { active: false },
          },
        });
        return jsonOk({ announcement: null });
      }

      const endsAtDate = new Date(body.endsAt);
      if (Number.isNaN(endsAtDate.getTime()) || endsAtDate.getTime() <= Date.now()) {
        return jsonError('VALIDATION_ERROR', 'La date de fin doit être dans le futur.', 400);
      }

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: ANNOUNCEMENT_AUDIT_ACTION,
          meta: {
            active: true,
            title: body.title,
            message: body.message,
            endsAt: endsAtDate.toISOString(),
          },
        },
      });

      const announcement = await getActiveAnnouncement();
      return jsonOk({ announcement });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
