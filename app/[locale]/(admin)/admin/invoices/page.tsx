'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { formatXaf } from '@/lib/pdf/shared/format';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { useAdminAction } from '@/lib/hooks/useAdminAction';
import { ReauthSheet } from '@/components/admin/ReauthSheet';

type Inv = {
  id: string;
  number: string;
  totalXaf: number;
  paidAt: string;
  sentByEmailAt: string | null;
  pdfPath: string | null;
  user: { id: string; phone: string; name: string | null; email: string | null };
};

export default function AdminInvoicesPage() {
  const toast = useToast();
  const { run, reauthOpen, setReauthOpen, handleReauthSuccess } = useAdminAction();
  const [items, setItems] = useState<Inv[] | null>(null);
  const [q, setQ] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (emailFilter) params.set('email', emailFilter);
    fetch(`/api/admin/invoices?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [q, emailFilter, refresh]);

  const resend = async (id: string) => {
    try {
      await run(`/api/admin/invoices/${id}/resend-email`, {
        method: 'POST',
        body: '{}',
      });
      toast.show('Email renvoyé', 'success');
      setRefresh((r) => r + 1);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erreur', 'error');
    }
  };

  const regenerate = async (id: string) => {
    try {
      await run(`/api/admin/invoices/${id}/regenerate-pdf`, {
        method: 'POST',
        body: '{}',
      });
      toast.show('PDF régénéré', 'success');
      setRefresh((r) => r + 1);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Erreur', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Factures d&apos;abonnement</h1>

      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Rechercher par numéro"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="thumb-zone flex-1 rounded-btn border border-slate-200 px-3 text-sm"
        />
        <select
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          className="thumb-zone rounded-btn border border-slate-200 px-3 text-sm"
        >
          <option value="">Email : tous</option>
          <option value="sent">Envoyés</option>
          <option value="not-sent">Non envoyés</option>
        </select>
      </div>

      {items === null ? (
        <SkeletonList rows={5} />
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Aucune facture</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((inv) => (
            <Card key={inv.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold font-mono">{inv.number}</p>
                  <p className="text-xs text-slate-500">
                    {inv.user.name ?? inv.user.phone} · {inv.user.email ?? 'sans email'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(new Date(inv.paidAt), 'fr')} · {formatXaf(inv.totalXaf)} ·{' '}
                    {inv.pdfPath ? '✅ PDF' : '❌ PDF'} · {inv.sentByEmailAt ? '✉️ Envoyé' : '✉️ Non envoyé'}
                  </p>
                </div>
                <div className="flex gap-1">
                  {inv.pdfPath && (
                    <a
                      href={`/api/subscriptions/invoices/${inv.id}/download`}
                      target="_blank"
                      rel="noopener"
                      className="rounded px-2 py-1 text-xs text-sage-600 hover:bg-sage-50"
                    >
                      PDF
                    </a>
                  )}
                  <button
                    onClick={() => regenerate(inv.id)}
                    className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Regénérer
                  </button>
                  {inv.user.email && (
                    <button
                      onClick={() => resend(inv.id)}
                      className="rounded px-2 py-1 text-xs text-sage-600 hover:bg-sage-50"
                    >
                      Renvoyer
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ReauthSheet open={reauthOpen} onOpenChange={setReauthOpen} onSuccess={handleReauthSuccess} />
    </div>
  );
}

