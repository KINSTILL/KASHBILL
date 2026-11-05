'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale } from 'next-intl';
import { adminFetch } from '@/lib/admin/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type UserSummary = {
  id: string;
  phone: string;
  name: string | null;
  businessName: string | null;
  role: 'USER' | 'SUPPORT' | 'ADMIN';
  bannedAt: string | null;
  suspendedUntil: string | null;
  proUntil: string | null;
  createdAt: string;
  _count: {
    documents: number;
    clients: number;
  };
};

export default function AdminUsersPage() {
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const loadUsers = (q: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (q) params.set('q', q);

    adminFetch(`/api/admin/users?${params.toString()}`).then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        const d = res.data as { users: UserSummary[]; total: number };
        setUsers(d.users);
        setTotal(d.total);
      }
    });
  };

  useEffect(() => {
    loadUsers(query, page);
  }, [query, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setPage(1);
        setQuery(search.trim());
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      setPage(1);
      setQuery(search.trim());
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs ({total})</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Téléphone, nom, boutique..."
            className="w-64"
          />
          <Button type="submit" variant="primary" size="sm">
            Rechercher
          </Button>
        </form>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3">Téléphone / Nom</th>
              <th className="px-4 py-3">Activité</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Pro</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isBanned = Boolean(u.bannedAt);
                const isSuspended =
                  u.suspendedUntil && new Date(u.suspendedUntil) > new Date();
                const isPro = u.proUntil && new Date(u.proUntil) > new Date();

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/admin/users/${u.id}` as Route}
                        className="font-semibold text-slate-900 hover:underline block"
                      >
                        {u.phone}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {u.name ?? 'Sans nom'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{u.businessName ?? '—'}</div>
                      <div className="text-slate-400">
                        {u._count?.documents ?? 0} docs · {u._count?.clients ?? 0} clients
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'SUPPORT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isBanned ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-error">
                          Banni
                        </span>
                      ) : isSuspended ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                          Suspendu
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-success">
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {isPro ? (
                        <span className="text-sage-700 font-medium">
                          Pro (jusqu&apos;au{' '}
                          {new Date(u.proUntil!).toLocaleDateString('fr-FR')})
                        </span>
                      ) : (
                        <span className="text-slate-400">Gratuit</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/${locale}/admin/users/${u.id}` as Route}
                        className="text-xs font-medium text-sage-600 hover:text-sage-800 underline"
                      >
                        Détails →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-slate-600">
          <div>
            Page {page} sur {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
