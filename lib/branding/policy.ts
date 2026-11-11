import { isPro, isWithinLogoGracePeriod } from '@/lib/auth/plan';

/**
 * Règles d'utilisation des images de marque.
 * - Logo : Pro, ou pendant la période de grâce après l'inscription (7 jours).
 * - Signature et cachet : Pro uniquement.
 * - Cachet sur les tickets 80 mm : Pro, et seulement si l'utilisateur l'a activé.
 *   Les tickets n'affichent jamais la signature.
 * Les images déjà téléversées restent en base : elles reviennent dès que le droit
 * est de nouveau ouvert (renouvellement), sans nouveau téléversement.
 */
export type BrandingUser = {
  proUntil: Date | string | null;
  createdAt?: Date | string;
};

export type ImageKind = 'logo' | 'signature' | 'stamp';

export function canUseLogo(user: BrandingUser): boolean {
  return isPro(user) || isWithinLogoGracePeriod(user);
}

export function canUseSignatureAndStamp(user: BrandingUser): boolean {
  return isPro(user);
}

export function canUseImage(user: BrandingUser, kind: ImageKind): boolean {
  return kind === 'logo' ? canUseLogo(user) : canUseSignatureAndStamp(user);
}

/** Retire les images auxquelles le compte n'a pas droit. */
export function applyImageBrandingPolicy<
  T extends { logoUrl: string | null; signatureUrl: string | null; stampUrl: string | null },
>(company: T, user: BrandingUser): T {
  return {
    ...company,
    logoUrl: canUseLogo(user) ? company.logoUrl : null,
    signatureUrl: canUseSignatureAndStamp(user) ? company.signatureUrl : null,
    stampUrl: canUseSignatureAndStamp(user) ? company.stampUrl : null,
  };
}
