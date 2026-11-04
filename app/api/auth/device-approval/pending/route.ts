import type { NextRequest } from 'next/server';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';
import { listPendingApprovals } from '@/lib/auth/device-approval';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const pending = await listPendingApprovals(user.id);
      return jsonOk({
        approvals: pending.map((p) => ({
          id: p.id,
          newDeviceId: p.newDeviceId,
          userAgent: p.userAgent,
          createdAt: p.createdAt,
        })),
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

