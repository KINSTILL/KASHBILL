import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { getCurrentUser } from '@/lib/auth/session';

const locales = ['fr', 'en'] as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const current = await getCurrentUser();

  const initialUser = current
    ? {
        id: current.user.id,
        phone: current.user.phone,
        name: current.user.name,
        businessName: current.user.businessName,
        city: current.user.city,
        role: current.user.role,
        mode: current.user.mode,
        proUntil: current.user.proUntil?.toISOString() ?? null,
        referralCode: current.user.referralCode,
        country: current.user.country,
        legalName: current.user.legalName,
        taxId: current.user.taxId,
        rccm: current.user.rccm,
        legalAddress: current.user.legalAddress,
        logoUrl: current.user.logoUrl,
        signatureUrl: current.user.signatureUrl,
        stampUrl: current.user.stampUrl,
        headerText: current.user.headerText,
        footerText: current.user.footerText,
        cgvText: current.user.cgvText,
        createdAt: current.user.createdAt.toISOString(),
      }
    : null;

  return (
    <NextIntlClientProvider messages={messages}>
      <SessionProvider initialUser={initialUser}>
        <OfflineBanner />
        {children}
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
