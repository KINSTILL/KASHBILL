import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';

export const metadata: Metadata = {
  title: 'MyCashBill - Authentification',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between px-6 py-4">
        <Link
          href={'/' as Route}
          className="text-xl font-bold tracking-tight text-sage-700"
        >
          MyCashBill
        </Link>
        <LocaleSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="py-4 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} MyCashBill &bull; Facturation hors-ligne &amp; Bouclier Social
      </footer>
    </div>
  );
}

