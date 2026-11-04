import type { NextRequest } from 'next/server';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { deviceApprovalApproveSchema } from '@/lib/validators/auth';
import { approveDevice } from '@/lib/auth/device-approval';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      const body = await req2.json();
      const data = deviceApprovalApproveSchema.parse(body);

      const result = await approveDevice(user.id, data.approvalId, data.code);

      if (!result.ok) {
        if (result.reason === 'EXPIRED') {
          return jsonError('APPROVAL_EXPIRED', 'Approbation expirée', 410);
        }
        if (result.reason === 'NOT_FOUND') {
          return jsonError('NOT_FOUND', 'Approbation introuvable', 404);
        }
        return jsonError('APPROVAL_INVALID', 'Code invalide', 400);
      }

      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'device_approved',
        meta: { approvalId: data.approvalId, newDeviceId: result.newDeviceId },
        ip,
        userAgent,
      });

      return jsonOk({ newDeviceId: result.newDeviceId });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

