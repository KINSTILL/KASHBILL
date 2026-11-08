import { env } from '@/lib/env';

export function hreflangAlternates(path: string = '') {
  const base = env.APP_URL || process.env.APP_URL || 'https://mycashbill.app';
  const cleanPath = path.startsWith('/') ? path : path ? `/${path}` : '';
  const normalized = cleanPath === '/' ? '' : cleanPath;

  return {
    'fr-FR': `${base}/fr${normalized}`,
    'en-US': `${base}/en${normalized}`,
    'x-default': `${base}/fr${normalized}`,
  };
}
