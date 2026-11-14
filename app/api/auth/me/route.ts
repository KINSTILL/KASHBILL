import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { requireAuth, writeAudit } from '@/lib/api/server';
import { clearSessionCookie } from '@/lib/auth/session';
import { isWhiteLabelActive, hasPaidProSubscription } from '@/lib/addons/queries';
import { isInTrial } from '@/lib/auth/plan';
import { canUseImage, type ImageKind } from '@/lib/branding/policy';
import { prisma } from '@/lib/db';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

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
  showStampOnTicket: z.boolean().optional(),
  headerText: z.string().max(200).optional().nullable(),
  footerText: z.string().max(500).optional().nullable(),
  cgvText: z.string().max(2000).optional().nullable(),
  // Couleurs de marque : white label uniquement (vérifié dans PATCH)
  brandPrimaryColor: z.string().regex(HEX_COLOR).optional().nullable(),
  brandAccentColor: z.string().regex(HEX_COLOR).optional().nullable(),
  // Précision des montants sur les documents : 0, 1 ou 2 décimales
  decimalPlaces: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
});

export async function GET(req: NextRequest): Promise<Response> {
  try {
    return await requireAuth(req, async (_req, { user, deviceId }) => {
      const [whiteLabel, hasPaidPro] = await Promise.all([
        isWhiteLabelActive(user.id),
        hasPaidProSubscription(user.id),
      ]);
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
          hasPaidPro,
          isInTrial: isInTrial(user),
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
          showStampOnTicket: user.showStampOnTicket,
          headerText: user.headerText,
          footerText: user.footerText,
          cgvText: user.cgvText,
          whiteLabel,
          brandPrimaryColor: user.brandPrimaryColor,
          brandAccentColor: user.brandAccentColor,
          decimalPlaces: user.decimalPlaces,
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
            brandPrimaryColor: null, brandAccentColor: null,
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

      const touchesBrand =
        parsed.data.brandPrimaryColor !== undefined || parsed.data.brandAccentColor !== undefined;
      if (touchesBrand && !(await isWhiteLabelActive(user.id))) {
        return jsonError(
          'FORBIDDEN',
          "La personnalisation des couleurs est réservée à l'option White label.",
          403
        );
      }

      // Logo, signature, cachet : modifiables uniquement avec un abonnement Pro actif
      const imageFields: { key: 'logoUrl' | 'signatureUrl' | 'stampUrl'; kind: ImageKind }[] = [
        { key: 'logoUrl', kind: 'logo' },
        { key: 'signatureUrl', kind: 'signature' },
        { key: 'stampUrl', kind: 'stamp' },
      ];
      for (const { key, kind } of imageFields) {
        const changed = parsed.data[key] !== undefined && parsed.data[key] !== (user as Record<string, unknown>)[key];
        if (changed && !canUseImage(user, kind)) {
          return jsonError(
            'FORBIDDEN',
            kind === 'logo'
              ? "Le logo est réservé aux comptes Pro (gratuit pendant 7 jours après l'inscription)."
              : 'La signature et le cachet sont réservés aux comptes Pro.',
            403
          );
        }
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
          showStampOnTicket: updated.showStampOnTicket,
          headerText: updated.headerText,
          footerText: updated.footerText,
          cgvText: updated.cgvText,
          whiteLabel: await isWhiteLabelActive(user.id),
          brandPrimaryColor: updated.brandPrimaryColor,
          brandAccentColor: updated.brandAccentColor,
          decimalPlaces: updated.decimalPlaces,
          createdAt: updated.createdAt,
        },
      });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
