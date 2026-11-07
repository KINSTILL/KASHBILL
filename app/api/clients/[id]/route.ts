import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/api/server';

const updateClientSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  country: z.string().max(2).nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const { id } = await params;
      const client = await prisma.client.findFirst({ where: { id, userId: user.id } });
      if (!client) return jsonError('NOT_FOUND', 'Client introuvable', 404);
      return jsonOk({ client });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user }) => {
      const { id } = await params;
      const body = await req2.json();
      const data = updateClientSchema.parse(body);

      const existing = await prisma.client.findFirst({ where: { id, userId: user.id } });
      if (!existing) return jsonError('NOT_FOUND', 'Client introuvable', 404);

      const client = await prisma.client.update({ where: { id }, data });
      return jsonOk({ client });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const { id } = await params;
      const existing = await prisma.client.findFirst({ where: { id, userId: user.id } });
      if (!existing) return jsonError('NOT_FOUND', 'Client introuvable', 404);

      await prisma.client.delete({ where: { id } });
      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

