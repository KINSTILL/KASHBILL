import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { verifyPin } from '@/lib/auth/pin';
import { clearSessionCookie } from '@/lib/auth/session';
import { rateLimit } from '@/lib/rate-limit';
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

const deleteAccountSchema = z.object({
  pin: z.string().regex(/^\d{6}$/),
});

/**
 * Suppression définitive du compte par l'utilisateur lui-même.
 * Exige le PIN. Les données liées (documents, clients, appareils, etc.)
 * sont supprimées en cascade par la base.
 */
export async function DELETE(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, ip, userAgent }) => {
      if (user.role !== 'USER') {
        return jsonError(
          'FORBIDDEN',
          'Les comptes administrateurs ne peuvent pas être supprimés ici',
          403
        );
      }

      const body = await req.json().catch(() => null);
      const parsed = deleteAccountSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError('BAD_REQUEST', 'PIN invalide', 400);
      }

      const rl = rateLimit(`delete-account:${user.id}`, 5, 15 * 60 * 1000);
      if (!rl.allowed) {
        return jsonError('RATE_LIMITED', 'Trop de tentatives, réessayez plus tard', 429);
      }

      const ok = await verifyPin(user.pinHash, parsed.data.pin);
      if (!ok) {
        return jsonError('INVALID_CREDENTIALS', 'PIN incorrect', 401);
      }

      await prisma.user.delete({ where: { id: user.id } });

      await writeAudit({
        action: 'account_deleted',
        meta: { userId: user.id },
        ip,
        userAgent,
      });

      const response = jsonOk({ ok: true });
      await clearSessionCookie(response);
      return response;
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
