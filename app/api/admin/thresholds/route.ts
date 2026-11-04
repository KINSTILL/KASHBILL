import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_thresholds', async () => {
      const thresholds = await prisma.fraudThreshold.findMany({ orderBy: { key: 'asc' } });
      return jsonOk({ thresholds });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

