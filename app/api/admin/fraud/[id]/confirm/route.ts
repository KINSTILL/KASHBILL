import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { addToBlacklist } from '@/lib/fraud/blacklist';

const schema = z.object({
  reason: z.string().min(1).max(500),
  blacklistPhone: z.boolean().default(false),
  blacklistTaxId: z.boolean().default(false),
  revokeDocument: z.boolean().default(false),
  banUser: z.boolean().default(false),
  suspendDays: z.number().int().positive().max(365).nullable().default(null),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'confirm_fraud', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const data = schema.parse(body);

      const flag = await prisma.fraudFlag.findUnique({
        where: { id },
        include: { user: true, document: true },
      });
      if (!flag) return jsonError('NOT_FOUND', 'Flag introuvable', 404);
      if (flag.status !== 'PENDING') return jsonError('CONFLICT', 'Flag déjà traité', 409);

      // Blacklist
      if (data.blacklistPhone && flag.user) {
        await addToBlacklist('PHONE', flag.user.phone, data.reason, admin.id);
      }
      if (data.blacklistTaxId && flag.user?.taxId) {
        await addToBlacklist('TAX_ID', flag.user.taxId, data.reason, admin.id);
      }
      if (flag.document?.contentHash) {
        await addToBlacklist('DOCUMENT_HASH', flag.document.contentHash, data.reason, admin.id);
      }

      // Révoquer la vérification publique
      if (data.revokeDocument && flag.document) {
        await prisma.documentVerification.updateMany({
          where: { documentId: flag.document.id },
          data: { isAuthentic: false, revokedAt: new Date(), revokedReason: data.reason },
        });
      }

      // Bannir ou suspendre
      if (flag.user) {
        if (data.banUser) {
          await prisma.user.update({
            where: { id: flag.user.id },
            data: { bannedAt: new Date(), bannedById: admin.id, banReason: data.reason },
          });
          await prisma.device.updateMany({
            where: { userId: flag.user.id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        } else if (data.suspendDays) {
          const until = new Date(Date.now() + data.suspendDays * 24 * 60 * 60 * 1000);
          await prisma.user.update({
            where: { id: flag.user.id },
            data: { suspendedUntil: until, suspendReason: data.reason },
          });
        }
      }

      // Marquer le flag comme traité
      await prisma.fraudFlag.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          reviewedById: admin.id,
          reviewedAt: new Date(),
          reviewNote: data.reason,
        },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: flag.userId,
        action: 'admin_fraud_confirmed',
        meta: { flagId: id, reason: data.reason, banUser: data.banUser, suspendDays: data.suspendDays },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

