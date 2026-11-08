import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

const SUPPORTED_LOCALES = ['fr', 'en'] as const;
const DEFAULT_LOCALE = 'fr';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/devices',
  '/settings',
  '/referrals',
  '/upgrade',
  '/documents',
  '/clients',
  '/admin',
];

const AUTH_PAGES = ['/login', '/register', '/recovery'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API + assets statiques
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|jpeg|svg|webp|woff2?|ttf|otf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Locale routing
  const segments = pathname.split('/').filter(Boolean);
  const hasLocale =
    segments.length > 0 &&
    SUPPORTED_LOCALES.includes(segments[0] as (typeof SUPPORTED_LOCALES)[number]);

  if (!hasLocale) {
    const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
    const locale = SUPPORTED_LOCALES.includes(
      cookieLocale as (typeof SUPPORTED_LOCALES)[number]
    )
      ? cookieLocale!
      : DEFAULT_LOCALE;
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = segments[0]!;
  const rest = segments.slice(1);
  const restPath = `/${rest.join('/')}`;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => restPath === p || restPath.startsWith(`${p}/`)
  );
  const isAuthPage = AUTH_PAGES.some(
    (p) => restPath === p || restPath.startsWith(`${p}/`)
  );

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    let target = `/${locale}/dashboard`;
    try {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      if (token) {
        const parts = token.split('.');
        const payloadPart = parts[1];
        if (parts.length === 3 && payloadPart) {
          const raw = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
          const json =
            typeof atob === 'function'
              ? atob(raw)
              : Buffer.from(raw, 'base64').toString('utf8');
          const payload = JSON.parse(json);
          if (payload?.role === 'ADMIN' || payload?.role === 'SUPPORT') {
            target = `/${locale}/admin`;
          }
        }
      }
    } catch {
      // Repli sûr sur /dashboard
    }
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-next-intl-locale', locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('x-next-intl-locale', locale);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|icons|manifest.webmanifest|.*\\..*).*)',
  ],
};

