import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { BulkSendView } from '@/components/documents/bulk/BulkSendView';

export default async function BulkSendDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect(`/${locale}/login` as Route);

  const doc = await prisma.document.findFirst({
    where: { id, userId: current.user.id },
    select: { id: true, number: true, type: true },
  });
  if (!doc) notFound();

  return (
    <BulkSendView
      documentId={doc.id}
      documentNumber={doc.number}
      locale={locale === 'en' ? 'en' : 'fr'}
    />
  );
}
