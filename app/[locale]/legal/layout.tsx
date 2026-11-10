import { PublicHeader } from '@/components/layout/PublicHeader';

export default async function LegalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <PublicHeader locale={locale} />
      {children}
    </>
  );
}
