export type LandingTier = 'tier1' | 'tier2';

export type LandingCountry = {
  code: string; // ISO 2 lettres ou "AF" (panafricain)
  name: string;
  flag: string;
  currency: string; // XAF, XOF, GHS, KES, UGX, EUR, USD, etc.
  currencySymbol: string; // FCFA, ₵, KSh, USh, €, $
};

export type LandingPricing = {
  proPriceLocal: number; // 2000 FCFA, 2000 XOF, 35 GHS, 500 KES, 15000 UGX, etc.
  proPriceLocalLabel: string; // "2 000 FCFA"
  proPriceFallbackUsd: number; // 3.5 USD (pour Tier 2 carte)
  proPriceFallbackLabel: string;
};

export type LandingPersonalization = {
  greeting: 'Bonjour' | 'Bonsoir';
  tier: LandingTier;
  country: LandingCountry;
  isAfrican: boolean;
  supportsMobileMoney: boolean;
  operators: string[]; // ["Wave", "Orange Money", "Free Money"] ou []
  pricing: LandingPricing;
  device: 'android' | 'ios' | 'desktop';
  isReturning: boolean;
  fromWhatsApp: boolean;
  suggestEnglish: boolean;
  suggestFrench: boolean;
};
