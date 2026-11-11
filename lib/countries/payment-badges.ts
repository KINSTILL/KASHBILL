export type PaymentBadge = {
  id: string;
  name: string;
  logoPath: string;
  brandColor: string;
};

export const PAYMENT_BADGES: Record<string, PaymentBadge> = {
  ORANGE_MONEY: { id: 'orange', name: 'Orange Money', logoPath: '/badges/OM.png', brandColor: '#FF7900' },
  MTN_MOMO: { id: 'mtn', name: 'MTN MoMo', logoPath: '/badges/MTN.jpg', brandColor: '#FFCB05' },
  WAVE: { id: 'wave', name: 'Wave', logoPath: '/badges/WAVE.png', brandColor: '#1DC8FF' },
  AIRTEL_MONEY: { id: 'airtel', name: 'Airtel Money', logoPath: '/badges/AIRTEL.png', brandColor: '#E40000' },
  MOOV_MONEY: { id: 'moov', name: 'Moov Money', logoPath: '/badges/MOOV.png', brandColor: '#0066B3' },
  MPESA: { id: 'mpesa', name: 'M-Pesa', logoPath: '/badges/m-pesa.jpg', brandColor: '#4CAF50' },
  VISA: { id: 'visa', name: 'Visa', logoPath: '/badges/VISA.png', brandColor: '#1A1F71' },
  MASTERCARD: { id: 'mastercard', name: 'Mastercard', logoPath: '/badges/MASTERCARD.png', brandColor: '#EB001B' },
};

export const ALL_NOTCHPAY_BADGES: PaymentBadge[] = [
  PAYMENT_BADGES.ORANGE_MONEY!,
  PAYMENT_BADGES.MTN_MOMO!,
  PAYMENT_BADGES.WAVE!,
  PAYMENT_BADGES.AIRTEL_MONEY!,
  PAYMENT_BADGES.MOOV_MONEY!,
  PAYMENT_BADGES.MPESA!,
  PAYMENT_BADGES.VISA!,
  PAYMENT_BADGES.MASTERCARD!,
];

export function getBadgesForCountry(_countryCode?: string): PaymentBadge[] {
  return [
    PAYMENT_BADGES.ORANGE_MONEY!,
    PAYMENT_BADGES.MTN_MOMO!,
    PAYMENT_BADGES.WAVE!,
    PAYMENT_BADGES.AIRTEL_MONEY!,
    PAYMENT_BADGES.MOOV_MONEY!,
    PAYMENT_BADGES.MPESA!,
  ];
}

export function getCardBadges(): PaymentBadge[] {
  return [PAYMENT_BADGES.VISA!, PAYMENT_BADGES.MASTERCARD!];
}
