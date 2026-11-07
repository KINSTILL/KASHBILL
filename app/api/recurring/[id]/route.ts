import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const { id } = await params;
      const { isPaused } = z.object({ isPaused: z.boolean() }).parse(await req2.json());
      const ex = await prisma.recurringSchedule.findFirst({ where: { id, userId: user.id } });
      if (!ex) return jsonError('NOT_FOUND', 'Introuvable', 404);
      const schedule = await prisma.recurringSchedule.update({ where: { id }, data: { isPaused } });
      return jsonOk({ schedule });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const { id } = await params;
      const ex = await prisma.recurringSchedule.findFirst({ where: { id, userId: user.id } });
      if (!ex) return jsonError('NOT_FOUND', 'Introuvable', 404);
      await prisma.recurringSchedule.delete({ where: { id } });
      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

