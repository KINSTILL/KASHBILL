import type { PdfCompany } from './types';

/** Palette MyCashBill par défaut (utilisée tant que l'entreprise n'a pas personnalisé ses couleurs). */
export const DEFAULT_BRAND = {
  primary: '#0F172A',
  accent: '#C98773',
} as const;

export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export type ResolvedBrand = { primary: string; accent: string };

/** Couleurs effectives du document : personnalisées si présentes, sinon palette par défaut. */
export function resolveBrand(company: Pick<PdfCompany, 'brand'>): ResolvedBrand {
  return {
    primary: company.brand?.primary ?? DEFAULT_BRAND.primary,
    accent: company.brand?.accent ?? DEFAULT_BRAND.accent,
  };
}
