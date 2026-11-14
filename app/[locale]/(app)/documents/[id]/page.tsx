import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import type { PdfFormat } from '@/lib/pdf/types';
import { loadPdfDocument } from '@/lib/documents/load-pdf-document';
import { DOC_TYPE_CONFIG } from '@/lib/documents/doc-type-config';
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
  const typeCfg = DOC_TYPE_CONFIG[doc.type];
  const typeLabel = locale === 'en' ? typeCfg.shortLabelEn : typeCfg.shortLabel;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg border border-emerald-100">
            {typeCfg.icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {doc.number}
              </h1>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {typeLabel}
              </span>
            </div>
            {doc.client?.name && (
              <p className="truncate text-xs text-slate-500">{doc.client.name}</p>
            )}
          </div>
        </div>
        {isDraft && (
          <Link href={`/${locale}/documents/${id}/edit` as Route} className="shrink-0">
            <Button size="sm" variant="secondary" className="gap-1.5 font-bold">
              <Pencil className="h-4 w-4" />
              <span>{locale === 'en' ? 'Edit' : 'Modifier'}</span>
            </Button>
          </Link>
        )}
      </div>
      <DocumentPreview pdfDoc={pdfDoc} initialFormat={initialFormat} />
    </div>
  );
}

