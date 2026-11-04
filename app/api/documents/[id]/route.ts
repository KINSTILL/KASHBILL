import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const { id } = await params;
      const doc = await prisma.document.findFirst({
        where: { id, userId: user.id },
        include: { client: true, verification: true },
      });
      if (!doc) return jsonError('NOT_FOUND', 'Document introuvable', 404);
      return jsonOk({ document: doc });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

