import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DocumentForm } from '@/components/documents/DocumentForm';
import { getCurrencyForCountry } from '@/lib/countries/currency';
import { getUserSuggestions } from '@/lib/documents/suggestions';

export default async function NewDocumentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const current = await getCurrentUser();

  if (!current) {
    redirect(`/${locale}/login` as Route);
  }

  const t = await getTranslations('documents.new');
  const suggestions = await getUserSuggestions(current.user.id);

  const clients = await prisma.client.findMany({
    where: { userId: current.user.id },
    select: { id: true, name: true, country: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {t('title')}
      </h1>
      <DocumentForm
        clients={clients}
        userCountry={current.user.country}
        userCurrency={getCurrencyForCountry(current.user.country)}
        suggestions={suggestions}
      />
    </div>
  );
}
