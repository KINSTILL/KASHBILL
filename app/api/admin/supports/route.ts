import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAdmin, writeAudit } from '@/lib/api/server';
import { hashPin } from '@/lib/auth/pin';
import { generateUniqueReferralCode } from '@/lib/auth/referral';
import { generateRecoveryCodes } from '@/lib/auth/recovery';
import { createHash } from 'node:crypto';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'list_supports', async () => {
      const supports = await prisma.user.findMany({
        where: { role: 'SUPPORT' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          createdAt: true,
          lastAdminLoginAt: true,
          bannedAt: true,
        },
      });
      return jsonOk({ supports });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  phone: z.string().regex(/^\+2376\d{8}$/),
  pin: z.string().regex(/^\d{6}$/),
  name: z.string().min(1).max(120),
});

function normalizeRecovery(c: string): string {
  return c.replace(/-/g, '').toUpperCase();
}
function hashRecovery(c: string): string {
  return createHash('sha256').update(normalizeRecovery(c)).digest('hex');
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    return await requireAdmin(req, 'create_support', async (req2, { user: admin, ip, userAgent }) => {
      const body = await req2.json();
      const data = createSchema.parse(body);

      const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) return jsonError('CONFLICT', 'Ce numéro est déjà utilisé', 409);

      const pinHash = await hashPin(data.pin);
      const referralCode = await generateUniqueReferralCode();
      const recoveryCodes = generateRecoveryCodes();

      const support = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            phone: data.phone,
            pinHash,
            name: data.name,
            role: 'SUPPORT',
            referralCode,
          },
        });
        await tx.recoveryCode.createMany({
          data: recoveryCodes.map((c) => ({ userId: created.id, codeHash: hashRecovery(c) })),
        });
        return created;
      });

      await writeAudit({
        actorId: admin.id,
        targetId: support.id,
        action: 'admin_support_created',
        meta: { phone: data.phone },
        ip,
        userAgent,
      });

      return jsonOk(
        {
          support: { id: support.id, phone: support.phone, name: support.name },
          recoveryCodes,
        },
        201
      );
    });
  } catch (err) {
    return handleApiError(err);
  }
}

