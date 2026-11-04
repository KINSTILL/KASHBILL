import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { revokeDevice } from '@/lib/auth/device';

const schema = z.object({ deviceId: z.string().min(1) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'unblock_device', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const { deviceId } = schema.parse(body);

      const revoked = await revokeDevice(id, deviceId);
      if (!revoked) return jsonError('NOT_FOUND', 'Appareil introuvable', 404);

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_device_revoked',
        meta: { deviceId },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

