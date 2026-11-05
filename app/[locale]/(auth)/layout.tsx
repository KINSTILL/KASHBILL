import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { LocaleToggle } from '@/components/layout/LocaleToggle';
import { ShieldCheck } from '@/components/ui/icons';

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
      <header className="flex w-full items-center justify-between px-6 py-4">
        <Link
          href={`/${locale}` as Route}
          className="group flex items-center gap-2.5 transition-transform active:scale-95"
          aria-label="MyCashBill"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-600 text-white shadow-md shadow-sage-600/20 transition-colors group-hover:bg-sage-700">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <span className="flex flex-col">
            <span className="text-xl font-bold leading-none tracking-tight text-slate-900">
              My<span className="text-sage-600">CashBill</span>
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('brandSubtitle')}
            </span>
          </span>
        </Link>
        <LocaleToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="w-full py-4 text-center">
        <p className="text-xs font-medium tracking-wide text-slate-400">
          {t('footer')}
        </p>
      </footer>
    </div>
  );
}
