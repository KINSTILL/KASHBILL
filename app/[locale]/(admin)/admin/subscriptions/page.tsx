'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { GrantProSheet } from '@/components/admin/GrantProSheet';
import { formatDate } from '@/lib/utils';

type Sub = {
  id: string;
  source: string;
  startsAt: string;
  endsAt: string;
  amountXaf: number | null;
  user: { id: string; phone: string; name: string | null; businessName: string | null; email: string | null };
  invoice: { id: string; number: string; pdfPath: string | null } | null;
};

export default function AdminSubscriptionsPage() {
  const locale = useLocale();
  const [items, setItems] = useState<Sub[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [grantOpen, setGrantOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    fetch(`/api/admin/subscriptions?${params}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [q, status, refresh]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <Button onClick={() => setGrantOpen(true)}>+ Offrir Pro</Button>
      </div>

      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Rechercher par téléphone / nom"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="thumb-zone flex-1 rounded-btn border border-slate-200 px-3 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="thumb-zone rounded-btn border border-slate-200 px-3 text-sm"
        >
          <option value="">Tous</option>
          <option value="active">Actifs</option>
          <option value="expired">Expirés</option>
        </select>
      </div>

      {items === null ? (
        <SkeletonList rows={5} />
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Aucun abonnement</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((sub) => {
            const active = new Date(sub.endsAt) > new Date();
            return (
              <Card key={sub.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{sub.user.name ?? sub.user.businessName ?? sub.user.phone}</p>
                    <p className="text-xs text-slate-500">
                      {sub.user.phone} · {sub.source} · {active ? '✅ Actif' : '⏸️ Expiré'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(new Date(sub.startsAt), locale === 'en' ? 'en' : 'fr')} →{' '}
                      {formatDate(new Date(sub.endsAt), locale === 'en' ? 'en' : 'fr')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.invoice && (
                      <a
                        href={`/api/subscriptions/invoices/${sub.invoice.id}/download`}
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-sage-600 underline"
                      >
                        Facture
                      </a>
                    )}
                    <Link
                      href={`/${locale}/admin/subscriptions/${sub.id}` as Route}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      Détail →
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <GrantProSheet open={grantOpen} onOpenChange={setGrantOpen} onSuccess={() => setRefresh((r) => r + 1)} />
    </div>
  );
}

