export type PaymentOperator = { code: string; name: string };

/**
 * Opérateurs Mobile Money par pays pawaPay.
 * Uniquement ces pays auront un dropdown d'opérateurs.
 * Tous les autres pays : saisie libre.
 */
export const PAWAPAY_OPERATORS: Record<string, PaymentOperator[]> = {
  BJ: [{ code: 'MTN_BJ', name: 'MTN MoMo' }, { code: 'MOOV_BJ', name: 'Moov Africa' }],
  BF: [{ code: 'ORANGE_BF', name: 'Orange Money' }, { code: 'MOOV_BF', name: 'Moov Africa' }],
  CI: [
    { code: 'ORANGE_CI', name: 'Orange Money' },
    { code: 'MTN_CI', name: 'MTN MoMo' },
    { code: 'MOOV_CI', name: 'Moov Africa' },
    { code: 'WAVE_CI', name: 'Wave' },
  ],
  GH: [
    { code: 'MTN_GH', name: 'MTN MoMo' },
    { code: 'VODAFONE_GH', name: 'Telecel Cash' },
    { code: 'AIRTELTIGO_GH', name: 'AT Money' },
  ],
  NG: [
    { code: 'MTN_NG', name: 'MTN MoMo PSB' },
    { code: 'AIRTEL_NG', name: 'Airtel SmartCash' },
    { code: 'NIBSS_NG', name: 'NIBSS Transfer' },
  ],
  SN: [
    { code: 'ORANGE_SN', name: 'Orange Money' },
    { code: 'WAVE_SN', name: 'Wave' },
    { code: 'FREE_SN', name: 'Free Money' },
  ],
  SL: [
    { code: 'ORANGE_SL', name: 'Orange Money' },
    { code: 'AFRICELL_SL', name: 'Africell Money' },
  ],
  CM: [
    { code: 'MTN_CM', name: 'MTN MoMo' },
    { code: 'ORANGE_CM', name: 'Orange Money' },
  ],
  CG: [
    { code: 'MTN_CG', name: 'MTN MoMo' },
    { code: 'AIRTEL_CG', name: 'Airtel Money' },
  ],
  GA: [
    { code: 'AIRTEL_GA', name: 'Airtel Money' },
    { code: 'MOOV_GA', name: 'Moov Africa' },
  ],
  CD: [
    { code: 'MPESA_CD', name: 'Vodacom M-Pesa' },
    { code: 'ORANGE_CD', name: 'Orange Money' },
    { code: 'AIRTEL_CD', name: 'Airtel Money' },
  ],
  KE: [
    { code: 'MPESA_KE', name: 'Safaricom M-Pesa' },
    { code: 'AIRTEL_KE', name: 'Airtel Money' },
  ],
  UG: [
    { code: 'MTN_UG', name: 'MTN Mobile Money' },
    { code: 'AIRTEL_UG', name: 'Airtel Money' },
  ],
  TZ: [
    { code: 'MPESA_TZ', name: 'Vodacom M-Pesa' },
    { code: 'TIGO_TZ', name: 'Tigo Pesa' },
    { code: 'AIRTEL_TZ', name: 'Airtel Money' },
    { code: 'HALOPESA_TZ', name: 'Halopesa' },
  ],
  RW: [
    { code: 'MTN_RW', name: 'MTN MoMo' },
    { code: 'AIRTEL_RW', name: 'Airtel Money' },
  ],
  ZM: [
    { code: 'MTN_ZM', name: 'MTN MoMo' },
    { code: 'AIRTEL_ZM', name: 'Airtel Money' },
    { code: 'ZAMTEL_ZM', name: 'Zamtel' },
  ],
  MW: [
    { code: 'AIRTEL_MW', name: 'Airtel Money' },
    { code: 'TNM_MW', name: 'TNM Mpamba' },
  ],
  MZ: [
    { code: 'MPESA_MZ', name: 'Vodacom M-Pesa' },
    { code: 'MOVITEL_MZ', name: 'Movitel e-Mola' },
  ],
  LS: [
    { code: 'MPESA_LS', name: 'Vodacom M-Pesa' },
    { code: 'ECONET_LS', name: 'Econet EcoCash' },
  ],
};

export function isPawaPayCountry(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return countryCode.toUpperCase() in PAWAPAY_OPERATORS;
}

export function getOperatorsForCountry(countryCode: string | null | undefined): PaymentOperator[] {
  if (!countryCode) return [];
  return PAWAPAY_OPERATORS[countryCode.toUpperCase()] ?? [];
}

export function getOperatorByCode(code: string | null | undefined): PaymentOperator | null {
  if (!code) return null;
  for (const ops of Object.values(PAWAPAY_OPERATORS)) {
    const found = ops.find((o) => o.code === code);
    if (found) return found;
  }
  return null;
}

