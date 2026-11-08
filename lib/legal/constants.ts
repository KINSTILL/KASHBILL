export const LEGAL_SLUGS = {
  cgu: 'cgu',
  cgv: 'cgv',
  privacy: 'privacy',
  cookies: 'cookies',
  mentions: 'mentions-legales',
  disclaimer: 'disclaimer',
  refund: 'refund',
} as const;

export type LegalSlug = typeof LEGAL_SLUGS[keyof typeof LEGAL_SLUGS];

export const LEGAL_SLUG_LIST: LegalSlug[] = Object.values(LEGAL_SLUGS);

export const LEGAL_SLUG_LABELS: Record<LegalSlug, string> = {
  cgu: 'CGU',
  cgv: 'CGV',
  privacy: 'Politique de confidentialité',
  cookies: 'Politique de cookies',
  'mentions-legales': 'Mentions légales',
  disclaimer: 'Clause de non-responsabilité',
  refund: 'Politique de remboursement',
};

/** Documents requiring explicit user consent at registration (slug → version check) */
export const CONSENT_REQUIRED_SLUGS: LegalSlug[] = ['cgu', 'privacy'];

export const CONSENT_COOKIE_NAME = 'mycashbill_consent';
export const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 an

