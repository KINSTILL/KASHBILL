import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { getCurrencyForCountry } from '@/lib/countries/currency';
import { ScanExpressView } from '@/components/documents/scan/ScanExpressView';

export default async function ScanExpressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const current = await getCurrentUser();

  if (!current) {
    redirect(`/${locale}/login` as Route);
  }

  const clients = await prisma.client.findMany({
    where: { userId: current.user.id },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  const currency = getCurrencyForCountry(current.user.country);

  return (
    <ScanExpressView
      clients={clients}
      currency={currency}
    />
  );
}
