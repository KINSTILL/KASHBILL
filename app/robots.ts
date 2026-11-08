import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const base = env.APP_URL || process.env.APP_URL || 'https://mycashbill.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api',
          '/admin',
          '/dashboard',
          '/documents',
          '/clients',
          '/settings',
          '/referrals',
          '/devices',
          '/subscriptions',
          '/*/admin',
          '/*/dashboard',
          '/*/documents',
          '/*/clients',
          '/*/settings',
          '/*/referrals',
          '/*/devices',
          '/*/subscriptions',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
