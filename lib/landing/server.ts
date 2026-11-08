import {
  TIER1_CONFIG,
  TIER2_PRICING,
  PAN_AFRICAN,
  COUNTRY_INFO,
  isAfricanCountry,
  ENGLISH_SPEAKING_AFRICA,
} from './data';
import type { LandingPersonalization } from './types';

type Input = {
  headers: Headers | { get(name: string): string | null };
  cookies: { get(name: string): { value: string } | undefined };
};

export function getPersonalizationServer({ headers, cookies }: Input): LandingPersonalization {
  // Heure Douala
  const now = new Date();
  const hourDouala = parseInt(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Africa/Douala',
      hour: 'numeric',
      hour12: false,
    }).format(now),
    10
  );
  const greeting: 'Bonjour' | 'Bonsoir' = hourDouala >= 18 || hourDouala < 6 ? 'Bonsoir' : 'Bonjour';

  // Détection pays
  const cdnCountry =
    headers.get('x-vercel-ip-country') ??
    headers.get('cf-ipcountry') ??
    headers.get('x-country-code');
  let countryCode = 'AF';
  if (cdnCountry && cdnCountry.length === 2 && cdnCountry.toUpperCase() !== 'XX') {
    countryCode = cdnCountry.toUpperCase();
  } else {
    const acceptLang = headers.get('accept-language') ?? '';
    const match = acceptLang.match(/[a-z]{2}-([a-z]{2})/i);
    if (match && match[1] && match[1].toUpperCase() !== 'XX') {
      countryCode = match[1].toUpperCase();
    }
  }

  // Tier 1 ou Tier 2
  const tier1 = TIER1_CONFIG[countryCode];
  const tier = tier1 ? 'tier1' : 'tier2';
  const isAfrican = isAfricanCountry(countryCode);

  const country = tier1
    ? tier1.country
    : countryCode === 'AF'
      ? PAN_AFRICAN
      : {
          code: countryCode,
          name: COUNTRY_INFO[countryCode]?.name ?? PAN_AFRICAN.name,
          flag: COUNTRY_INFO[countryCode]?.flag ?? PAN_AFRICAN.flag,
          currency: 'USD',
          currencySymbol: '$',
        };

  const operators = tier1?.operators ?? [];
  const pricing = tier1?.pricing ?? TIER2_PRICING;

  // Device
  const ua = headers.get('user-agent') ?? '';
  const device: 'android' | 'ios' | 'desktop' =
    /android/i.test(ua) ? 'android' : /iphone|ipad|ipod/i.test(ua) ? 'ios' : 'desktop';

  // Returning visitor
  const isReturning = cookies.get('mycashbill_visitor')?.value === 'returning';

  // WhatsApp referrer
  const referrer = headers.get('referer') ?? '';
  const fromWhatsApp = /wa\.me|whatsapp|web\.whatsapp/i.test(referrer);

  // Suggestion langue
  const suggestEnglish = ENGLISH_SPEAKING_AFRICA.has(countryCode);
  const suggestFrench = !ENGLISH_SPEAKING_AFRICA.has(countryCode) && isAfrican;

  return {
    greeting,
    tier,
    country,
    isAfrican,
    supportsMobileMoney: tier === 'tier1',
    operators,
    pricing,
    device,
    isReturning,
    fromWhatsApp,
    suggestEnglish,
    suggestFrench,
  };
}
