import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { DocumentForm } from '@/components/documents/DocumentForm';
import { getCurrencyForCountry } from '@/lib/countries/currency';
import type { ComputedPayload } from '@/lib/documents/payload';

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const current = await getCurrentUser();

  if (!current) {
    redirect(`/${locale}/login` as Route);
  }

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.userId !== current.user.id) {
    notFound();
  }

  // Un document envoyé n'est plus modifiable : on renvoie vers son aperçu.
  if (doc.sentViaWhatsAppAt || doc.sentViaEmailAt) {
    redirect(`/${locale}/documents/${id}` as Route);
  }

  const clients = await prisma.client.findMany({
    where: { userId: current.user.id },
    select: { id: true, name: true, country: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {doc.number} · Modifier le brouillon
      </h1>
      <DocumentForm
        clients={clients}
        userCountry={current.user.country}
        userCurrency={getCurrencyForCountry(current.user.country)}
        editDocument={{
          id: doc.id,
          type: doc.type,
          locale: doc.locale,
          clientId: doc.clientId,
          payload: doc.payload as unknown as ComputedPayload,
        }}
      />
    </div>
  );
}
