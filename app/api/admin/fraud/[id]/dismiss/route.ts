import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

const schema = z.object({ note: z.string().min(1).max(500) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'dismiss_fraud', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const { note } = schema.parse(body);

      const flag = await prisma.fraudFlag.findUnique({ where: { id } });
      if (!flag) return jsonError('NOT_FOUND', 'Flag introuvable', 404);
      if (flag.status !== 'PENDING') return jsonError('CONFLICT', 'Flag déjà traité', 409);

      await prisma.fraudFlag.update({
        where: { id },
        data: {
          status: 'DISMISSED',
          reviewedById: admin.id,
          reviewedAt: new Date(),
          reviewNote: note,
        },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: flag.userId,
        action: 'admin_fraud_dismissed',
        meta: { flagId: id, note },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

