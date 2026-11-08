import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { jsonOk, handleApiError } from '@/lib/api-helpers';

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  service: z.string().trim().min(1).max(200),
  amount: z.number().int().positive().max(1_000_000_000),
});

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const data = schema.parse(await req.json());
    const cookieStore = await cookies();

    cookieStore.set('mycashbill_demo_prefill', JSON.stringify(data), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 900, // 15 minutes
      path: '/',
    });

    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
