import type { LandingCountry, LandingPricing } from './types';

// 54 pays africains + 15 pays majeurs hors Afrique
export const COUNTRY_INFO: Record<string, { name: string; flag: string }> = {
  DZ: { name: 'Algérie', flag: '🇩🇿' },
  EG: { name: 'Égypte', flag: '🇪🇬' },
  LY: { name: 'Libye', flag: '🇱🇾' },
  MA: { name: 'Maroc', flag: '🇲🇦' },
  SD: { name: 'Soudan', flag: '🇸🇩' },
  TN: { name: 'Tunisie', flag: '🇹🇳' },
  BJ: { name: 'Bénin', flag: '🇧🇯' },
  BF: { name: 'Burkina Faso', flag: '🇧🇫' },
  CV: { name: 'Cap-Vert', flag: '🇨🇻' },
  CI: { name: "Côte d'Ivoire", flag: '🇨🇮' },
  GM: { name: 'Gambie', flag: '🇬🇲' },
  GH: { name: 'Ghana', flag: '🇬🇭' },
  GN: { name: 'Guinée', flag: '🇬🇳' },
  GW: { name: 'Guinée-Bissau', flag: '🇬🇼' },
  LR: { name: 'Libéria', flag: '🇱🇷' },
  ML: { name: 'Mali', flag: '🇲🇱' },
  MR: { name: 'Mauritanie', flag: '🇲🇷' },
  NE: { name: 'Niger', flag: '🇳🇪' },
  NG: { name: 'Nigéria', flag: '🇳🇬' },
  SN: { name: 'Sénégal', flag: '🇸🇳' },
  SL: { name: 'Sierra Leone', flag: '🇸🇱' },
  TG: { name: 'Togo', flag: '🇹🇬' },
  AO: { name: 'Angola', flag: '🇦🇴' },
  CM: { name: 'Cameroun', flag: '🇨🇲' },
  CF: { name: 'Centrafrique', flag: '🇨🇫' },
  TD: { name: 'Tchad', flag: '🇹🇩' },
  CG: { name: 'Congo', flag: '🇨🇬' },
  CD: { name: 'RDC', flag: '🇨🇩' },
  GQ: { name: 'Guinée équatoriale', flag: '🇬🇶' },
  GA: { name: 'Gabon', flag: '🇬🇦' },
  ST: { name: 'São Tomé', flag: '🇸🇹' },
  BI: { name: 'Burundi', flag: '🇧🇮' },
  KM: { name: 'Comores', flag: '🇰🇲' },
  DJ: { name: 'Djibouti', flag: '🇩🇯' },
  ER: { name: 'Érythrée', flag: '🇪🇷' },
  ET: { name: 'Éthiopie', flag: '🇪🇹' },
  KE: { name: 'Kenya', flag: '🇰🇪' },
  MG: { name: 'Madagascar', flag: '🇲🇬' },
  MW: { name: 'Malawi', flag: '🇲🇼' },
  MU: { name: 'Maurice', flag: '🇲🇺' },
  MZ: { name: 'Mozambique', flag: '🇲🇿' },
  RW: { name: 'Rwanda', flag: '🇷🇼' },
  SC: { name: 'Seychelles', flag: '🇸🇨' },
  SO: { name: 'Somalie', flag: '🇸🇴' },
  SS: { name: 'Soudan du Sud', flag: '🇸🇸' },
  TZ: { name: 'Tanzanie', flag: '🇹🇿' },
  UG: { name: 'Ouganda', flag: '🇺🇬' },
  ZM: { name: 'Zambie', flag: '🇿🇲' },
  ZW: { name: 'Zimbabwe', flag: '🇿🇼' },
  BW: { name: 'Botswana', flag: '🇧🇼' },
  SZ: { name: 'Eswatini', flag: '🇸🇿' },
  LS: { name: 'Lesotho', flag: '🇱🇸' },
  NA: { name: 'Namibie', flag: '🇳🇦' },
  ZA: { name: 'Afrique du Sud', flag: '🇿🇦' },
  FR: { name: 'France', flag: '🇫🇷' },
  BE: { name: 'Belgique', flag: '🇧🇪' },
  CH: { name: 'Suisse', flag: '🇨🇭' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  US: { name: 'États-Unis', flag: '🇺🇸' },
  GB: { name: 'Royaume-Uni', flag: '🇬🇧' },
  DE: { name: 'Allemagne', flag: '🇩🇪' },
  ES: { name: 'Espagne', flag: '🇪🇸' },
  IT: { name: 'Italie', flag: '🇮🇹' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
  BR: { name: 'Brésil', flag: '🇧🇷' },
  IN: { name: 'Inde', flag: '🇮🇳' },
  CN: { name: 'Chine', flag: '🇨🇳' },
  JP: { name: 'Japon', flag: '🇯🇵' },
  AU: { name: 'Australie', flag: '🇦🇺' },
};

export const PAN_AFRICAN: LandingCountry = {
  code: 'AF',
  name: 'Afrique',
  flag: '🌍',
  currency: 'USD',
  currencySymbol: '$',
};

// Tier 1 : 7 pays avec Mobile Money actif (aligné Notch Pay)
export const TIER1_CONFIG: Record<
  string,
  {
    country: LandingCountry;
    operators: string[];
    pricing: LandingPricing;
  }
> = {
  CM: {
    country: { code: 'CM', name: 'Cameroun', flag: '🇨🇲', currency: 'XAF', currencySymbol: 'FCFA' },
    operators: ['MTN MoMo', 'Orange Money'],
    pricing: {
      proPriceLocal: 2000,
      proPriceLocalLabel: '2 000 FCFA',
      proPriceFallbackUsd: 3.5,
      proPriceFallbackLabel: '3,50 USD',
    },
  },
  CI: {
    country: { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF', currencySymbol: 'FCFA' },
    operators: ['Wave', 'MTN MoMo', 'Orange Money'],
    pricing: {
      proPriceLocal: 2000,
      proPriceLocalLabel: '2 000 FCFA',
      proPriceFallbackUsd: 3.5,
      proPriceFallbackLabel: '3,50 USD',
    },
  },
  SN: {
    country: { code: 'SN', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF', currencySymbol: 'FCFA' },
    operators: ['Wave', 'Orange Money', 'Free Money'],
    pricing: {
      proPriceLocal: 2000,
      proPriceLocalLabel: '2 000 FCFA',
      proPriceFallbackUsd: 3.5,
      proPriceFallbackLabel: '3,50 USD',
    },
  },
  GA: {
    country: { code: 'GA', name: 'Gabon', flag: '🇬🇦', currency: 'XAF', currencySymbol: 'FCFA' },
    operators: ['Airtel Money', 'Moov Money'],
    pricing: {
      proPriceLocal: 2000,
      proPriceLocalLabel: '2 000 FCFA',
      proPriceFallbackUsd: 3.5,
      proPriceFallbackLabel: '3,50 USD',
    },
  },
  GH: {
    country: { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', currencySymbol: '₵' },
    operators: ['MTN MoMo', 'Telecel Cash', 'AirtelTigo'],
    pricing: {
      proPriceLocal: 35,
      proPriceLocalLabel: '35 GH₵',
      proPriceFallbackUsd: 3.5,
      proPriceFallbackLabel: '3,50 USD',
    },
  },
  KE: {
    country: { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', currencySymbol: 'KSh' },
    operators: ['M-Pesa', 'Airtel Money'],
    pricing: {
      proPriceLocal: 450,
      proPriceLocalLabel: '450 KSh',
      proPriceFallbackUsd: 3.5,
      proPriceFallbackLabel: '3,50 USD',
    },
  },
  UG: {
    country: { code: 'UG', name: 'Ouganda', flag: '🇺🇬', currency: 'UGX', currencySymbol: 'USh' },
    operators: ['MTN MoMo', 'Airtel Money'],
    pricing: {
      proPriceLocal: 13000,
      proPriceLocalLabel: '13 000 USh',
      proPriceFallbackUsd: 3.5,
      proPriceFallbackLabel: '3,50 USD',
    },
  },
};

// Tier 2 : prix par défaut en FCFA
export const TIER2_PRICING: LandingPricing = {
  proPriceLocal: 2000,
  proPriceLocalLabel: '2 000 FCFA',
  proPriceFallbackUsd: 3.5,
  proPriceFallbackLabel: '2 000 FCFA',
};

// Pays anglophones d'Afrique (pour suggestion de langue)
export const ENGLISH_SPEAKING_AFRICA = new Set([
  'GH',
  'KE',
  'UG',
  'NG',
  'ZA',
  'ZM',
  'ZW',
  'MW',
  'RW',
  'TZ',
  'LS',
  'SZ',
  'NA',
  'BW',
  'LR',
  'SL',
  'GM',
  'SS',
  'SD',
  'ET',
  'SO',
  'ER',
  'MU',
  'SC',
  'DJ',
]);

const NON_AFRICAN = [
  'FR',
  'BE',
  'CH',
  'CA',
  'US',
  'GB',
  'DE',
  'ES',
  'IT',
  'PT',
  'BR',
  'IN',
  'CN',
  'JP',
  'AU',
];

const AFRICAN_COUNTRY_CODES = new Set(
  Object.keys(COUNTRY_INFO).filter((c) => !NON_AFRICAN.includes(c))
);

export function isAfricanCountry(code: string): boolean {
  if (!code) return false;
  return code === 'AF' || AFRICAN_COUNTRY_CODES.has(code.toUpperCase());
}
