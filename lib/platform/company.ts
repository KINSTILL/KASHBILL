import { env } from '@/lib/env';

export type PlatformCompany = {
  legalName: string;
  taxId: string;
  rccm: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  web: string;
  logoUrl: string;
  vatRegistered: boolean;
  vatRate: number;
  isFullyConfigured: boolean;
};

export function getPlatformCompany(): PlatformCompany {
  const taxId = env.PLATFORM_TAX_ID;
  const rccm = env.PLATFORM_RCCM;
  const address = env.PLATFORM_ADDRESS;
  return {
    legalName: env.PLATFORM_LEGAL_NAME,
    taxId,
    rccm,
    address,
    city: env.PLATFORM_CITY,
    country: env.PLATFORM_COUNTRY,
    phone: env.PLATFORM_PHONE,
    email: env.PLATFORM_EMAIL,
    web: env.PLATFORM_WEB,
    logoUrl: env.PLATFORM_LOGO_URL,
    vatRegistered: env.PLATFORM_VAT_REGISTERED === 'true',
    vatRate: env.PLATFORM_VAT_RATE,
    isFullyConfigured:
      taxId !== 'À_COMPLÉTER' && rccm !== 'À_COMPLÉTER' && address !== 'À_COMPLÉTER',
  };
}

