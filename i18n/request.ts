import { getRequestConfig } from 'next-intl/server';

const locales = ['fr', 'en'] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let resolvedLocale = await requestLocale;
  if (!resolvedLocale || !locales.includes(resolvedLocale as (typeof locales)[number])) {
    resolvedLocale = 'fr';
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
