export interface DialCountry {
  code: string;
  dialCode: string;
  flag: string;
  nameFr: string;
  nameEn: string;
  minDigits: number;
  maxDigits: number;
}

export const COUNTRIES: DialCountry[] = [
  // Afrique Centrale (CEMAC & voisins)
  { code: 'CM', dialCode: '+237', flag: '🇨🇲', nameFr: 'Cameroun', nameEn: 'Cameroon', minDigits: 9, maxDigits: 9 },
  { code: 'CI', dialCode: '+225', flag: '🇨🇮', nameFr: "Côte d'Ivoire", nameEn: 'Ivory Coast', minDigits: 10, maxDigits: 10 },
  { code: 'SN', dialCode: '+221', flag: '🇸🇳', nameFr: 'Sénégal', nameEn: 'Senegal', minDigits: 9, maxDigits: 9 },
  { code: 'GA', dialCode: '+241', flag: '🇬🇦', nameFr: 'Gabon', nameEn: 'Gabon', minDigits: 7, maxDigits: 8 },
  { code: 'CG', dialCode: '+242', flag: '🇨🇬', nameFr: 'Congo', nameEn: 'Congo', minDigits: 9, maxDigits: 9 },
  { code: 'CD', dialCode: '+243', flag: '🇨🇩', nameFr: 'RDC', nameEn: 'DR Congo', minDigits: 9, maxDigits: 9 },
  { code: 'TD', dialCode: '+235', flag: '🇹🇩', nameFr: 'Tchad', nameEn: 'Chad', minDigits: 8, maxDigits: 8 },
  { code: 'CF', dialCode: '+236', flag: '🇨🇫', nameFr: 'Centrafrique', nameEn: 'Central African Republic', minDigits: 8, maxDigits: 8 },
  { code: 'GQ', dialCode: '+240', flag: '🇬🇶', nameFr: 'Guinée Équatoriale', nameEn: 'Equatorial Guinea', minDigits: 9, maxDigits: 9 },

  // Afrique de l'Ouest (UEMOA & CEDEAO)
  { code: 'BJ', dialCode: '+229', flag: '🇧🇯', nameFr: 'Bénin', nameEn: 'Benin', minDigits: 8, maxDigits: 10 },
  { code: 'TG', dialCode: '+228', flag: '🇹🇬', nameFr: 'Togo', nameEn: 'Togo', minDigits: 8, maxDigits: 8 },
  { code: 'BF', dialCode: '+226', flag: '🇧🇫', nameFr: 'Burkina Faso', nameEn: 'Burkina Faso', minDigits: 8, maxDigits: 8 },
  { code: 'ML', dialCode: '+223', flag: '🇲🇱', nameFr: 'Mali', nameEn: 'Mali', minDigits: 8, maxDigits: 8 },
  { code: 'NE', dialCode: '+227', flag: '🇳🇪', nameFr: 'Niger', nameEn: 'Niger', minDigits: 8, maxDigits: 8 },
  { code: 'GN', dialCode: '+224', flag: '🇬🇳', nameFr: 'Guinée', nameEn: 'Guinea', minDigits: 9, maxDigits: 9 },
  { code: 'NG', dialCode: '+234', flag: '🇳🇬', nameFr: 'Nigéria', nameEn: 'Nigeria', minDigits: 10, maxDigits: 10 },
  { code: 'GH', dialCode: '+233', flag: '🇬🇭', nameFr: 'Ghana', nameEn: 'Ghana', minDigits: 9, maxDigits: 10 },

  // Autres Afrique
  { code: 'RW', dialCode: '+250', flag: '🇷🇼', nameFr: 'Rwanda', nameEn: 'Rwanda', minDigits: 9, maxDigits: 9 },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪', nameFr: 'Kenya', nameEn: 'Kenya', minDigits: 9, maxDigits: 9 },
  { code: 'ZA', dialCode: '+27', flag: '🇿🇦', nameFr: 'Afrique du Sud', nameEn: 'South Africa', minDigits: 9, maxDigits: 10 },
  { code: 'MA', dialCode: '+212', flag: '🇲🇦', nameFr: 'Maroc', nameEn: 'Morocco', minDigits: 9, maxDigits: 9 },
  { code: 'DZ', dialCode: '+213', flag: '🇩🇿', nameFr: 'Algérie', nameEn: 'Algeria', minDigits: 9, maxDigits: 9 },
  { code: 'TN', dialCode: '+216', flag: '🇹🇳', nameFr: 'Tunisie', nameEn: 'Tunisia', minDigits: 8, maxDigits: 8 },

  // Europe & Amérique (Diaspora)
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', nameFr: 'France', nameEn: 'France', minDigits: 9, maxDigits: 9 },
  { code: 'BE', dialCode: '+32', flag: '🇧🇪', nameFr: 'Belgique', nameEn: 'Belgium', minDigits: 9, maxDigits: 9 },
  { code: 'CH', dialCode: '+41', flag: '🇨🇭', nameFr: 'Suisse', nameEn: 'Switzerland', minDigits: 9, maxDigits: 9 },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦', nameFr: 'Canada', nameEn: 'Canada', minDigits: 10, maxDigits: 10 },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', nameFr: 'États-Unis', nameEn: 'United States', minDigits: 10, maxDigits: 10 },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', nameFr: 'Royaume-Uni', nameEn: 'United Kingdom', minDigits: 10, maxDigits: 10 },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', nameFr: 'Allemagne', nameEn: 'Germany', minDigits: 10, maxDigits: 11 },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹', nameFr: 'Italie', nameEn: 'Italy', minDigits: 9, maxDigits: 10 },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', nameFr: 'Espagne', nameEn: 'Spain', minDigits: 9, maxDigits: 9 },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', nameFr: 'Émirats Arabes Unis', nameEn: 'United Arab Emirates', minDigits: 9, maxDigits: 9 },
  { code: 'CN', dialCode: '+86', flag: '🇨🇳', nameFr: 'Chine', nameEn: 'China', minDigits: 11, maxDigits: 11 },
];

export const DEFAULT_COUNTRY: DialCountry = {
  code: 'CM',
  dialCode: '+237',
  flag: '🇨🇲',
  nameFr: 'Cameroun',
  nameEn: 'Cameroon',
  minDigits: 9,
  maxDigits: 9,
};

export function getCountryByCode(code: string): DialCountry {
  return (
    COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) ||
    DEFAULT_COUNTRY
  );
}

export function findCountryByPhone(phone: string): DialCountry {
  const cleaned = phone.replace(/\s+/g, '');
  if (!cleaned.startsWith('+')) return DEFAULT_COUNTRY;
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (cleaned.startsWith(c.dialCode)) return c;
  }
  return DEFAULT_COUNTRY;
}

