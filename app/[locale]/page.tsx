import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import type { Route } from 'next';
import { getCurrentUser } from '@/lib/auth/session';
import { isAdmin } from '@/lib/admin/roles';
import { getPersonalizationServer } from '@/lib/landing/server';
import { LandingPage } from './_landing/LandingPage';
import { env } from '@/lib/env';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: 'MyCashBill — Factures pro en 60 secondes, depuis WhatsApp',
  description:
    'Générez devis, factures et reçus conformes en 60 secondes. Envoyez par WhatsApp. Conçu pour les entrepreneurs africains.',
  openGraph: {
    title: 'MyCashBill — Facturation pro en 60 secondes',
    description:
      'Devis, factures, reçus. Conforme OHADA et multidevise. Mobile Money ou carte bancaire.',
    images: ['/og/landing.png'],
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: {
    canonical: '/fr',
    languages: { 'fr-FR': '/fr', 'en-US': '/en', 'x-default': '/fr' },
  },
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const current = await getCurrentUser();
  if (current) {
    if (isAdmin(current.user)) {
      redirect(`/${locale}/admin` as Route);
    }
    redirect(`/${locale}/dashboard` as Route);
  }

  const h = await headers();
  const c = await cookies();
  const personalization = getPersonalizationServer({ headers: h, cookies: c });

  return <LandingPage personalization={personalization} locale={locale} />;
}
