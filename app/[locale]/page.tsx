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
  title: 'MyCashBill — Factures & Devis Pro pour E-commerce et Prestataires',
  description:
    'Besoin d’envoyer un devis ou une facture pro à un client ? Créez vos documents conformes OHADA en 60 secondes sur smartphone et partagez le PDF sur WhatsApp.',
  openGraph: {
    title: 'MyCashBill — Factures & Devis Pro pour E-commerce et Prestataires',
    description:
      'Devis, factures et reçus conformes OHADA. Partagez vos PDF sur WhatsApp, règlements directs par Mobile Money ou banque.',
    images: ['/og/landing.png'],
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: {
    canonical: '/fr',
    languages: { 'fr-FR': '/fr', 'en-US': '/en', 'x-default': '/fr' },
  },
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ landing?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const forceLanding = sp?.landing === '1';

  const current = await getCurrentUser();
  if (current && !forceLanding) {
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
