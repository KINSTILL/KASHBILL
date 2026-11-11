import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import type { PdfFormat } from '@/lib/pdf/types';
import { loadPdfDocument } from '@/lib/documents/load-pdf-document';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Pencil } from 'lucide-react';

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { locale, id } = await params;
  const { format: formatQuery } = await searchParams;

  const current = await getCurrentUser();
  if (!current) {
    redirect(`/${locale}/login` as Route);
  }

  const loaded = await loadPdfDocument(id, current.user.id);
  if (!loaded) {
    notFound();
  }
  const { doc, pdfDoc } = loaded;

  const initialFormat: PdfFormat =
    formatQuery === 'ticket'
      ? 'ticket'
      : formatQuery === 'a4'
      ? 'a4'
      : doc.type === 'TICKET' || doc.type === 'RECU'
      ? 'ticket'
      : 'a4';

  // Un document n'est modifiable qu'en brouillon (tant qu'il n'a pas été envoyé).
  const isDraft = !doc.sentViaWhatsAppAt && !doc.sentViaEmailAt;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {doc.number} ({doc.type})
        </h1>
        {isDraft && (
          <Link href={`/${locale}/documents/${id}/edit` as Route} className="shrink-0">
            <Button size="sm" variant="secondary" className="gap-1.5 font-bold">
              <Pencil className="h-4 w-4" />
              <span>Modifier</span>
            </Button>
          </Link>
        )}
      </div>
      <DocumentPreview pdfDoc={pdfDoc} initialFormat={initialFormat} />
    </div>
  );
}

