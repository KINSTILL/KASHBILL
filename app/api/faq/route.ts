import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, handleApiError } from '@/lib/api-helpers';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const locale = url.searchParams.get('locale');
    const limit = Number(url.searchParams.get('limit') || '10');

    const entries = await prisma.fAQEntry.findMany({
      where: {
        isPublished: true,
        ...(category ? { category } : {}),
        ...(locale ? { locale: locale.toUpperCase() as 'FR' | 'EN' } : {}),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: Math.min(limit, 50),
      select: { id: true, question: true, answer: true, category: true },
    });

    return jsonOk({ entries });
  } catch (err) {
    return handleApiError(err);
  }
}

