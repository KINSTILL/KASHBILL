import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { clearSessionCookie } from '@/lib/auth/session';
import { prisma } from '@/lib/db';

const updateProfileSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  businessName: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  mode: z.enum(['ECOMMERCE', 'PRESTATION']).optional(),
  country: z.string().length(2).optional(),
  legalName: z.string().max(200).optional().nullable(),
  legalForm: z.string().max(50).optional().nullable(),
  taxId: z.string().max(50).optional().nullable(),
  rccm: z.string().max(50).optional().nullable(),
  legalAddress: z.string().max(500).optional().nullable(),
  logoUrl: z.string().max(500).optional().nullable(),
  signatureUrl: z.string().max(500).optional().nullable(),
  stampUrl: z.string().max(500).optional().nullable(),
  headerText: z.string().max(200).optional().nullable(),
  footerText: z.string().max(500).optional().nullable(),
  cgvText: z.string().max(2000).optional().nullable(),
});

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, deviceId }) => {
      return jsonOk({
        user: {
          id: user.id,
          phone: user.phone,
          accountType: user.accountType,
          name: user.name,
          businessName: user.businessName,
          city: user.city,
          locale: user.locale,
          role: user.role,
          mode: user.mode,
          proUntil: user.proUntil,
          referralCode: user.referralCode,
          country: user.country,
          legalName: user.legalName,
          legalForm: user.legalForm,
          taxId: user.taxId,
          rccm: user.rccm,
          legalAddress: user.legalAddress,
          logoUrl: user.logoUrl,
          signatureUrl: user.signatureUrl,
          stampUrl: user.stampUrl,
          headerText: user.headerText,
          footerText: user.footerText,
          cgvText: user.cgvText,
          createdAt: user.createdAt,
        },
        deviceId,
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (req2, { user, ip, userAgent }) => {
      if (user.role === 'ADMIN') {
        const activeAdmins = await prisma.user.count({ where: { role: 'ADMIN', bannedAt: null } });
        if (activeAdmins <= 1) return jsonError('FORBIDDEN', 'Impossible de supprimer le dernier administrateur actif.', 403);
      }

      const body = await req2.json().catch(() => ({}));
      if (body?.confirm !== true) return jsonError('VALIDATION_ERROR', 'Confirmation requise. Envoyez { "confirm": true }.', 400);

      const anonSuffix = user.id.slice(-8);
      const now = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.device.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: now } });
        await tx.recoveryCode.deleteMany({ where: { userId: user.id } });
        await tx.deviceApproval.deleteMany({ where: { userId: user.id } });
        await tx.user.update({
          where: { id: user.id },
          data: {
            phone: `deleted_${anonSuffix}@deleted.local`,
            referralCode: `deleted_${anonSuffix}`,
            name: 'Compte supprimé',
            businessName: null, legalName: null, legalAddress: null, city: null,
            taxId: null, rccm: null, logoUrl: null, signatureUrl: null, stampUrl: null,
            headerText: null, footerText: null, cgvText: null, legalForm: null,
            bannedAt: now, banReason: "Compte supprimé par l'utilisateur",
          },
        });
      });

      await clearSessionCookie();
      await writeAudit({
        actorId: null,
        targetId: user.id,
        action: 'account_deleted_by_user',
        meta: { anonymized: true },
        ip,
        userAgent,
      });

      return jsonOk({ ok: true, message: 'Compte supprimé. Données archivées.' });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user }) => {
      const body = await req.json().catch(() => null);
      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError('BAD_REQUEST', 'Données de profil invalides', 400);
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: parsed.data,
      });

      return jsonOk({
        user: {
          id: updated.id,
          phone: updated.phone,
          name: updated.name,
          businessName: updated.businessName,
          city: updated.city,
          locale: updated.locale,
          role: updated.role,
          mode: updated.mode,
          proUntil: updated.proUntil,
          referralCode: updated.referralCode,
          country: updated.country,
          legalName: updated.legalName,
          legalForm: updated.legalForm,
          taxId: updated.taxId,
          rccm: updated.rccm,
          legalAddress: updated.legalAddress,
          logoUrl: updated.logoUrl,
          signatureUrl: updated.signatureUrl,
          stampUrl: updated.stampUrl,
          headerText: updated.headerText,
          footerText: updated.footerText,
          cgvText: updated.cgvText,
          createdAt: updated.createdAt,
        },
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
