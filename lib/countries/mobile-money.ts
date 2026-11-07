// Internal note: operator coverage aligned with mobile money corridors.
// Keep the aggregation provider name out of public code (files, functions, UI text).
// If adding a new corridor, add it here and nowhere else.

export type PaymentOperator = { code: string; name: string };

/**
 * Pays supportant les liens de paiement Mobile Money sur les documents.
 * SEULEMENT 7 pays — les autres utilisent le texte libre.
 */
export const MOBILE_MONEY_OPERATORS: Record<string, PaymentOperator[]> = {
  CM: [
    { code: 'MTN_CM', name: 'MTN Mobile Money' },
    { code: 'ORANGE_CM', name: 'Orange Money' },
  ],
  CI: [
    { code: 'MTN_CI', name: 'MTN MoMo' },
    { code: 'ORANGE_CI', name: 'Orange Money' },
    { code: 'WAVE_CI', name: 'Wave' },
  ],
  SN: [
    { code: 'WAVE_SN', name: 'Wave' },
    { code: 'ORANGE_SN', name: 'Orange Money' },
    { code: 'FREE_SN', name: 'Free Money' },
  ],
  GA: [
    { code: 'AIRTEL_GA', name: 'Airtel Money' },
    { code: 'MOOV_GA', name: 'Moov Money' },
  ],
  GH: [
    { code: 'MTN_GH', name: 'MTN MoMo' },
    { code: 'TELECEL_GH', name: 'Telecel Cash' },
    { code: 'AIRTELTIGO_GH', name: 'AirtelTigo Money' },
  ],
  KE: [
    { code: 'MPESA_KE', name: 'M-Pesa' },
    { code: 'AIRTEL_KE', name: 'Airtel Money' },
  ],
  UG: [
    { code: 'MTN_UG', name: 'MTN MoMo' },
    { code: 'AIRTEL_UG', name: 'Airtel Money' },
  ],
};

export const SUPPORTED_PAYMENT_COUNTRIES = Object.keys(MOBILE_MONEY_OPERATORS);

export function isSupportedPaymentCountry(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return countryCode.toUpperCase() in MOBILE_MONEY_OPERATORS;
}

export function getOperatorsForCountry(countryCode: string | null | undefined): PaymentOperator[] {
  if (!countryCode) return [];
  return MOBILE_MONEY_OPERATORS[countryCode.toUpperCase()] ?? [];
}

export function getOperatorByCode(code: string | null | undefined): PaymentOperator | null {
  if (!code) return null;
  for (const ops of Object.values(MOBILE_MONEY_OPERATORS)) {
    const found = ops.find((o) => o.code === code);
    if (found) return found;
  }
  return null;
}
