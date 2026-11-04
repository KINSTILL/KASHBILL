'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAdminAction } from '@/lib/hooks/useAdminAction';
import { ReauthSheet } from '@/components/admin/ReauthSheet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';

type BlacklistEntry = {
  id: string;
  type: 'PHONE' | 'TAX_ID' | 'DOCUMENT_HASH';
  value: string;
  reason: string;
  createdAt: string;
  createdBy: {
    phone: string;
  } | null;
};

export default function AdminBlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Add form sheet
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [type, setType] = useState<'PHONE' | 'TAX_ID' | 'DOCUMENT_HASH'>('PHONE');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { run, reauthOpen, setReauthOpen, handleReauthSuccess } = useAdminAction();

  const loadEntries = () => {
    setLoading(true);
    adminFetch('/api/admin/blacklist').then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        setEntries((res.data as { entries: BlacklistEntry[] }).entries);
      }
    });
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !reason.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      await run('/api/admin/blacklist', {
        method: 'POST',
        body: JSON.stringify({
          type,
          value: value.trim(),
          reason: reason.trim(),
        }),
      });
      setFeedback({ type: 'success', msg: 'Entrée ajoutée à la blacklist.' });
      setIsAddOpen(false);
      setValue('');
      setReason('');
      loadEntries();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’ajout à la blacklist.';
      setFeedback({
        type: 'error',
        msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blacklist ({entries.length})</h1>
          <p className="text-sm text-slate-600">
            Éléments interdits d&apos;inscription ou d&apos;émission sur la plateforme.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setIsAddOpen(true)}>
          + Ajouter à la blacklist
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.msg}
        </div>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Valeur bloquée</th>
              <th className="px-4 py-3">Motif</th>
              <th className="px-4 py-3">Ajouté par</th>
              <th className="px-4 py-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aucune entrée en liste noire.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-error">
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                    {entry.value}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {entry.reason}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {entry.createdBy?.phone ?? 'Système'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 text-right">
                    {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Add Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <form onSubmit={handleAdd} className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Ajouter une entrée à la blacklist
          </h2>

          <div>
            <label className="text-xs font-medium text-slate-700">Type de donnée</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'PHONE' | 'TAX_ID' | 'DOCUMENT_HASH')}
              className="w-full border rounded-lg p-2 text-sm mt-1"
            >
              <option value="PHONE">Numéro de téléphone</option>
              <option value="TAX_ID">NUI / RCCM</option>
              <option value="DOCUMENT_HASH">Hash de document (SHA-256)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Valeur</label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'PHONE' ? '+2376...' : 'Valeur exacte'}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Motif</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Escroquerie avérée, usurpation d'identité..."
              required
            />
          </div>

          <Button
            type="submit"
            variant="danger"
            fullWidth
            isLoading={submitting}
            disabled={!value.trim() || !reason.trim()}
          >
            Bloquer définitivement
          </Button>
        </form>
      </Sheet>

      {/* PIN Re-authentication Sheet */}
      <ReauthSheet
        open={reauthOpen}
        onOpenChange={setReauthOpen}
        onSuccess={handleReauthSuccess}
      />
    </div>
  );
}
