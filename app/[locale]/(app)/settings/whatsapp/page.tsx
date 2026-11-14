import { PersonalWhatsAppSetup } from '@/components/whatsapp/PersonalWhatsAppSetup';

export default async function SettingsWhatsAppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <PersonalWhatsAppSetup locale={locale === 'en' ? 'en' : 'fr'} />;
}
