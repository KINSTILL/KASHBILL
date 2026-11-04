import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/api/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'view_user_detail', async () => {
      const { id } = await params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          phone: true,
          name: true,
          businessName: true,
          city: true,
          role: true,
          proUntil: true,
          pendingProDays: true,
          bannedAt: true,
          banReason: true,
          suspendedUntil: true,
          suspendReason: true,
          flaggedForReview: true,
          country: true,
          legalName: true,
          taxId: true,
          rccm: true,
          referralCode: true,
          duplicationsThisMonth: true,
          productPhotosCount: true,
          createdAt: true,
          lastAdminLoginAt: true,
          devices: {
            select: {
              deviceId: true,
              userAgent: true,
              lastSeenAt: true,
              revokedAt: true,
            },
          },
          subscriptions: { orderBy: { createdAt: 'desc' }, take: 10 },
          referralsMade: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              filleul: { select: { phone: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          referralReceived: {
            select: { status: true, parrain: { select: { phone: true } } },
          },
          _count: { select: { documents: true, clients: true } },
        },
      });

      if (!user) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);
      return jsonOk({ user });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

