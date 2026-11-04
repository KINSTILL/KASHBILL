import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';
import { isPro } from '@/lib/auth/plan';
import { FREE_CLIENTS_LIMIT } from '@/lib/constants';

const createClientSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const clients = await prisma.client.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      });
      return jsonOk({ clients });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      const body = await req2.json();
      const data = createClientSchema.parse(body);

      if (!isPro(user)) {
        const count = await prisma.client.count({ where: { userId: user.id } });
        if (count >= FREE_CLIENTS_LIMIT) {
          return jsonError(
            'PLAN_LIMIT_REACHED',
            `Limite gratuite atteinte (${FREE_CLIENTS_LIMIT} clients). Passez Pro pour des clients illimités.`,
            403
          );
        }
      }

      const client = await prisma.client.create({
        data: { userId: user.id, ...data },
      });

      await prisma.auditLog.create({
        data: { actorId: user.id, targetId: client.id, action: 'client_created', ip, userAgent },
      });

      return jsonOk({ client }, 201);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

