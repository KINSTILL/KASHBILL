import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';

const schema = z.object({ reason: z.string().min(1).max(300) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'flag_user', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const { reason } = schema.parse(body);

      await prisma.user.update({
        where: { id },
        data: { flaggedForReview: true },
      });

      await prisma.fraudFlag.create({
        data: {
          userId: id,
          reason: 'MANUAL_FLAG',
          severity: 'MEDIUM',
          details: { note: reason },
          autoDetected: false,
        },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_user_flagged',
        meta: { reason },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

