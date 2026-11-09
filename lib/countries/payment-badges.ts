export type PaymentBadge = {
  id: string;
  name: string;
  logoPath: string;
  brandColor: string;
};

export const PAYMENT_BADGES: Record<string, PaymentBadge> = {
  ORANGE_MONEY: { id: 'orange', name: 'Orange Money', logoPath: '/badges/orange-money.svg', brandColor: '#FF7900' },
  MTN_MOMO: { id: 'mtn', name: 'MTN MoMo', logoPath: '/badges/mtn-momo.svg', brandColor: '#004F71' },
  WAVE: { id: 'wave', name: 'Wave', logoPath: '/badges/wave.svg', brandColor: '#1DC8FF' },
  AIRTEL_MONEY: { id: 'airtel', name: 'Airtel Money', logoPath: '/badges/airtel-money.svg', brandColor: '#E40000' },
  MOOV_MONEY: { id: 'moov', name: 'Moov Money', logoPath: '/badges/moov-money.svg', brandColor: '#0066B3' },
  FREE_MONEY: { id: 'free', name: 'Free Money', logoPath: '/badges/free-money.svg', brandColor: '#E30613' },
  MPESA: { id: 'mpesa', name: 'M-Pesa', logoPath: '/badges/m-pesa.svg', brandColor: '#4CAF50' },
  VISA: { id: 'visa', name: 'Visa', logoPath: '/badges/visa.svg', brandColor: '#1A1F71' },
  MASTERCARD: { id: 'mastercard', name: 'Mastercard', logoPath: '/badges/mastercard.svg', brandColor: '#EB001B' },
};

export function getBadgesForCountry(countryCode: string): PaymentBadge[] {
  const map: Record<string, string[]> = {
    CM: ['MTN_MOMO', 'ORANGE_MONEY'],
    CI: ['MTN_MOMO', 'ORANGE_MONEY', 'WAVE'],
    SN: ['WAVE', 'ORANGE_MONEY', 'FREE_MONEY'],
    GA: ['AIRTEL_MONEY', 'MOOV_MONEY'],
    GH: ['MTN_MOMO', 'WAVE'],
    KE: ['MPESA', 'AIRTEL_MONEY'],
    UG: ['MTN_MOMO', 'AIRTEL_MONEY'],
  };
  const ids = map[countryCode.toUpperCase()] ?? [];
  return ids.map((id) => PAYMENT_BADGES[id]).filter((b): b is PaymentBadge => Boolean(b));
}

export function getCardBadges(): PaymentBadge[] {
  return [PAYMENT_BADGES.VISA, PAYMENT_BADGES.MASTERCARD].filter((b): b is PaymentBadge => Boolean(b));
}
