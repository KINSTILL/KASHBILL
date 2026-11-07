import type { NextRequest } from 'next/server';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';
import { getFullQuotaStatus } from '@/lib/quota/check';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const quota = await getFullQuotaStatus(user);
      return jsonOk(quota);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

