/**
 * Map ISO country code → ISO currency code.
 * Fallback USD pour pays non listés.
 */
export const COUNTRY_CURRENCY: Record<string, string> = {
  // Afrique de l'Ouest (UEMOA)
  BJ: 'XOF',
  BF: 'XOF',
  CI: 'XOF',
  GW: 'XOF',
  ML: 'XOF',
  NE: 'XOF',
  SN: 'XOF',
  TG: 'XOF',
  // Afrique Centrale (CEMAC)
  CM: 'XAF',
  CF: 'XAF',
  TD: 'XAF',
  CG: 'XAF',
  GQ: 'XAF',
  GA: 'XAF',
  // Afrique de l'Est
  KE: 'KES',
  UG: 'UGX',
  TZ: 'TZS',
  RW: 'RWF',
  BI: 'BIF',
  ET: 'ETB',
  SO: 'SOS',
  SS: 'SSP',
  // Afrique Australe
  ZA: 'ZAR',
  ZM: 'ZMW',
  MW: 'MWK',
  MZ: 'MZN',
  LS: 'LSL',
  SZ: 'SZL',
  NA: 'NAD',
  BW: 'BWP',
  ZW: 'ZWL',
  AO: 'AOA',
  // Afrique du Nord
  DZ: 'DZD',
  EG: 'EGP',
  LY: 'LYD',
  MA: 'MAD',
  TN: 'TND',
  SD: 'SDG',
  // Autres Afrique de l'Ouest
  NG: 'NGN',
  GH: 'GHS',
  SL: 'SLE',
  LR: 'LRD',
  GM: 'GMD',
  GN: 'GNF',
  CV: 'CVE',
  MR: 'MRU',
  ST: 'STN',
  // Europe (majeurs)
  FR: 'EUR',
  BE: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  LU: 'EUR',
  GB: 'GBP',
  CH: 'CHF',
  // Amériques / Asie (majeurs)
  US: 'USD',
  CA: 'CAD',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  BR: 'BRL',
};

export function getCurrencyForCountry(code: string | null | undefined): string {
  if (!code) return 'XAF';
  return COUNTRY_CURRENCY[code.toUpperCase()] ?? 'USD';
}

