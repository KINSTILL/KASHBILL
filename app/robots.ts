import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
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
    sitemap: `${env.APP_URL}/sitemap.xml`,
    host: env.APP_URL,
  };
}
