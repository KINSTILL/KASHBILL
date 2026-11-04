import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { addToBlacklist } from '@/lib/fraud/blacklist';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_blacklist', async () => {
      const entries = await prisma.blacklistEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { createdBy: { select: { phone: true } } },
      });
      return jsonOk({ entries });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  type: z.enum(['PHONE', 'TAX_ID', 'DOCUMENT_HASH']),
  value: z.string().min(1).max(200),
  reason: z.string().min(1).max(500),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'manage_blacklist', async (req2, { user: admin, ip, userAgent }) => {
      const body = await req2.json();
      const data = createSchema.parse(body);

      const entry = await addToBlacklist(data.type, data.value, data.reason, admin.id);

      await writeAudit({
        actorId: admin.id,
        action: 'admin_blacklist_added',
        meta: { type: data.type, value: data.value, reason: data.reason },
        ip,
        userAgent,
      });

      return jsonOk({ entry }, 201);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

