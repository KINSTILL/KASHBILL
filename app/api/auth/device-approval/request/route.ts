import type { NextRequest } from 'next/server';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { deviceApprovalRequestSchema } from '@/lib/validators/auth';
import { createApproval } from '@/lib/auth/device-approval';
import { rateLimit } from '@/lib/rate-limit';
import { RATE_LIMIT_DEVICE_APPROVAL_PER_USER } from '@/lib/constants';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      const rl = rateLimit(
        `devappr:${user.id}`,
        RATE_LIMIT_DEVICE_APPROVAL_PER_USER.limit,
        RATE_LIMIT_DEVICE_APPROVAL_PER_USER.windowMs
      );
      if (!rl.allowed) {
        return jsonError('RATE_LIMITED', 'Trop de demandes, réessayez plus tard', 429);
      }

      const body = await req2.json();
      const data = deviceApprovalRequestSchema.parse(body);

      const { approvalId } = await createApproval(user.id, data.deviceId, userAgent, ip);

      await writeAudit({
        actorId: user.id,
        targetId: user.id,
        action: 'device_approval_requested',
        meta: { approvalId, newDeviceId: data.deviceId },
        ip,
        userAgent,
      });

      return jsonOk({ approvalId });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

