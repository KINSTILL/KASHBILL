// Source unique de l'identité visuelle MyCashBill hors Tailwind (PDF, e-mails, favicon).
// Identité Neo-Fintech : Émeraude vibrant & Noir Minuit haute fidélité.
export const BRAND = {
  name: 'MyCashBill',
  primary: '#059669', // Emerald 600 - confiance, cash, croissance
  primaryLight: '#10B981', // Emerald 500 - éclat moderne
  primaryDark: '#047857', // Emerald 700 - profondeur
  primaryGradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  gold: '#F59E0B', // Accent Pro
  ink: '#090D16', // Deep Midnight Slate
  inkSoft: '#475569',
  surface: '#FFFFFF',
  background: '#F8FAFC',
  // Rétrocompatibilité tokens sage-* pour les templates PDF/email existants :
  sage: '#059669',
  sageLight: '#10B981',
  sageDark: '#047857',
} as const;
