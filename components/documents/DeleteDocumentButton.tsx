'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/device/haptics';

type Props = {
  documentId: string;
  documentNumber: string;
  className?: string;
};

/**
 * Bouton supprimer un BROUILLON, avec confirmation. À n'afficher que pour les brouillons :
 * l'API refuse la suppression d'un document envoyé.
 * Appelle DELETE /api/documents/[id] puis rafraîchit la liste.
 */
export function DeleteDocumentButton({ documentId, documentNumber, className }: Props) {
  const t = useTranslations('documents.list');
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    haptic('medium');
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'fetch' },
      });
      if (!res.ok) {
        toast.show(t('deleteError'), 'error');
        return;
      }
      toast.show(t('deleted'), 'success');
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast.show(t('deleteError'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={`${t('delete')} ${documentNumber}`}
        onClick={() => {
          haptic('light');
          setConfirmOpen(true);
        }}
        className={
          className ??
          'flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-ring'
        }
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-slate-950">
              {t('delete')} {documentNumber} ?
            </p>
            <p className="mt-2 text-[13px] text-slate-600">
              {t('deleteConfirm')}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {t('cancelDelete')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? '…' : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
