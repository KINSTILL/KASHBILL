import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { LocaleToggle } from '@/components/layout/LocaleToggle';
import { Logo } from '@/components/layout/Logo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return {
    title: `MyCashBill - ${t('metaTitle')}`,
  };
}

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex w-full items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Logo href={`/${locale}`} subtitle={t('brandSubtitle')} hideSubtitleOnMobile size="sm" />
        <LocaleToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="w-full py-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
          <Link href={`/${locale}/blog` as Route} className="hover:text-sage-700 hover:underline">
            Blog
          </Link>
          <span>·</span>
          <Link href={`/${locale}/faq` as Route} className="hover:text-sage-700 hover:underline">
            FAQ
          </Link>
        </div>
        <p className="text-xs font-medium tracking-wide text-slate-400">
          {t('footer')}
        </p>
      </footer>
    </div>
  );
}
