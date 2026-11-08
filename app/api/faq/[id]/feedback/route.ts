import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';

const schema = z.object({ helpful: z.boolean() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await params;
    const { helpful } = schema.parse(await req.json());
    await prisma.fAQEntry.update({
      where: { id },
      data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } },
    });
    return jsonOk({ ok: true });
  } catch (err) { return handleApiError(err); }
}

