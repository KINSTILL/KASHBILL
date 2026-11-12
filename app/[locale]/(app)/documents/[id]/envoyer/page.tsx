import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { loadPdfDocument } from '@/lib/documents/load-pdf-document';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
import { SendDocumentView } from '@/components/documents/send/SendDocumentView';
import { getPersonalStatus } from '@/lib/whatsapp/personal';

export default async function SendDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const current = await getCurrentUser();
  if (!current) redirect(`/${locale}/login` as Route);

  const loaded = await loadPdfDocument(id, current.user.id);
  if (!loaded) notFound();
  const { doc, pdfDoc } = loaded;

  const config = DOC_TYPE_CONFIG[doc.type];

  const personal = await getPersonalStatus(current.user.id);
  const personalWhatsApp = {
    hasAddOn: personal.hasAddOn,
    connected: personal.status === 'CONNECTED',
  };

  return (
    <SendDocumentView
      documentId={doc.id}
      pdfDoc={pdfDoc}
      locale={locale === 'en' ? 'en' : 'fr'}
      docLabel={locale === 'en' ? config.labelEn : config.label}
      defaultPhone={doc.client?.phone ?? ''}
      clientName={doc.client?.name ?? null}
      personalWhatsApp={personalWhatsApp}
    />
  );
}
