import type { NextRequest } from 'next/server';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';
import { listActiveDevices } from '@/lib/auth/device';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, deviceId }) => {
      const devices = await listActiveDevices(user.id);
      return jsonOk({
        devices: devices.map((d) => ({
          deviceId: d.deviceId,
          userAgent: d.userAgent,
          lastSeenAt: d.lastSeenAt,
          lastIp: d.lastIp,
          createdAt: d.createdAt,
          isCurrent: d.deviceId === deviceId,
        })),
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
