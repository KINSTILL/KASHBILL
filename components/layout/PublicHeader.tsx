import Link from 'next/link';
import type { Route } from 'next';
import { Logo } from '@/components/layout/Logo';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';

// En-tête des pages publiques (Blog, FAQ, Mentions légales) : même logo et mêmes tokens que la landing.
export function PublicHeader({ locale }: { locale: string }) {
  const isFr = locale === 'fr';
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
        <Logo href={`/${locale}`} size="sm" />
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link href={`/${locale}/blog` as Route} className="hidden hover:text-ink sm:block">
            Blog
          </Link>
          <Link href={`/${locale}/faq` as Route} className="hidden hover:text-ink sm:block">
            FAQ
          </Link>
          <LocaleSwitcher />
          <Link href={`/${locale}/login` as Route} className="font-medium text-slate-700 hover:text-ink">
            {isFr ? 'Se connecter' : 'Log in'}
          </Link>
        </nav>
      </div>
    </header>
  );
}
