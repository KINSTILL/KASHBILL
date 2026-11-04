'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type AuditLogItem = {
  id: string;
  action: string;
  meta: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: {
    phone: string;
    name: string | null;
    role: string;
  } | null;
  user: {
    phone: string;
    name: string | null;
  } | null;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [queryAction, setQueryAction] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = (act: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (act) params.set('action', act);

    adminFetch(`/api/admin/audit?${params.toString()}`).then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        const d = res.data as { logs: AuditLogItem[]; total: number };
        setLogs(d.logs);
        setTotal(d.total);
      }
    });
  };

  useEffect(() => {
    loadLogs(queryAction, page);
  }, [queryAction, page]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQueryAction(actionFilter.trim());
  };

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registre d&apos;Audit ({total})</h1>
          <p className="text-sm text-slate-600">
            Journal immuable append-only garanti par trigger PostgreSQL.
          </p>
        </div>

        <form onSubmit={handleFilter} className="flex gap-2">
          <Input
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filtrer par action (ex: admin_user_banned)"
            className="w-64"
          />
          <Button type="submit" variant="primary" size="sm">
            Filtrer
          </Button>
          {queryAction && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActionFilter('');
                setQueryAction('');
                setPage(1);
              }}
            >
              Effacer
            </Button>
          )}
        </form>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Acteur</th>
              <th className="px-4 py-3">Cible</th>
              <th className="px-4 py-3">Détails (Meta)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aucun log trouvé.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.actor ? (
                      <div>
                        <div className="font-semibold text-slate-900">
                          {log.actor.phone}
                        </div>
                        <div className="text-slate-400">
                          {log.actor.role} {log.actor.name ? `· ${log.actor.name}` : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Système / Anonyme</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {log.user ? (
                      <div>
                        <div className="font-semibold text-slate-900">{log.user.phone}</div>
                        <div className="text-slate-400">{log.user.name ?? 'Utilisateur'}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono max-w-sm truncate">
                    {log.meta ? JSON.stringify(log.meta) : '—'}
                  </td>
                </tr>
              ))
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
