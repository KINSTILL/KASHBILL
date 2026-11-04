import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { hashPin } from '@/lib/auth/pin';
import { generateRecoveryCodes } from '@/lib/auth/recovery';

const schema = z.object({
  newPin: z.string().regex(/^\d{6}$/),
  reason: z.string().min(1).max(300),
});

function normalizeRecovery(c: string): string {
  return c.replace(/-/g, '').toUpperCase();
}
function hashRecovery(c: string): string {
  return createHash('sha256').update(normalizeRecovery(c)).digest('hex');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    return await requireAdmin(req, 'reset_pin', async (req2, { user: admin, ip, userAgent }) => {
      const { id } = await params;
      const body = await req2.json();
      const { newPin, reason } = schema.parse(body);

      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) return jsonError('NOT_FOUND', 'Utilisateur introuvable', 404);

      const newHash = await hashPin(newPin);
      const recoveryCodes = generateRecoveryCodes();

      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id }, data: { pinHash: newHash } });
        // Supprimer les anciens codes, créer les nouveaux
        await tx.recoveryCode.deleteMany({ where: { userId: id, usedAt: null } });
        await tx.recoveryCode.createMany({
          data: recoveryCodes.map((c) => ({ userId: id, codeHash: hashRecovery(c) })),
        });
      });

      // Révoquer tous les devices du target
      await prisma.device.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await writeAudit({
        actorId: admin.id,
        targetId: id,
        action: 'admin_pin_reset',
        meta: { reason },
        ip,
        userAgent,
      });

      return jsonOk({ recoveryCodes, reason });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

