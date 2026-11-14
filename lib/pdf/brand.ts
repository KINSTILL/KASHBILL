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

/**
 * Tokens visuels partagés par tous les templates PDF.
 * Objectif : homogénéité esthétique (inspiration marketing) sans toucher au contenu ni
 * aux règles métier. Uniquement des valeurs supportées par react-pdf (pas de gradient,
 * pas d'ombre, pas de grid).
 */
export const PDF_TOKENS = {
  // Palette neutre commune
  neutral: {
    ink: '#0F172A', // texte principal
    subdued: '#475569', // texte secondaire
    muted: '#64748B', // labels
    faint: '#94A3B8', // mentions légères
    line: '#E2E8F0', // filets / séparateurs
    hairline: '#CBD5E1', // filets doux
    surface: '#F8FAFC', // fond de bloc
    surfaceAlt: '#F1F5F9', // fond de bloc alterné / en-tête tableau
    zebra: '#F8FAFC', // ligne zébrée légère
  },
  // Rayons
  radius: { sm: 3, md: 4, lg: 6, pill: 999 },
  // Espacements (points react-pdf)
  space: { xs: 2, sm: 4, md: 8, lg: 12, xl: 16 },
  // Teinte de statut (badge « prête / payée ») — teinte positive neutre
  statusOk: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
} as const;

/**
 * Couleur de texte lisible (encre foncée ou blanc) sur un fond donné.
 * Évite le texte blanc illisible quand l'entreprise choisit une couleur de marque claire.
 */
export function readableOn(hex: string): string {
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(hex);
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1]!, 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * lin((n >> 16) & 0xff) + 0.7152 * lin((n >> 8) & 0xff) + 0.0722 * lin(n & 0xff);
  return lum > 0.179 ? PDF_TOKENS.neutral.ink : '#FFFFFF';
}

/** Mélange une couleur hexadécimale avec du blanc (0 = couleur, 1 = blanc). */
export function tint(hex: string, amount: number): string {
  const m = /^#?([0-9A-Fa-f]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const a = Math.max(0, Math.min(1, amount));
  const mix = (c: number) => Math.round(c + (255 - c) * a);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
