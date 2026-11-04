'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAdminAction } from '@/lib/hooks/useAdminAction';
import { ReauthSheet } from '@/components/admin/ReauthSheet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';

type Threshold = {
  key: string;
  value: number;
  floor: number;
  ceiling: number;
  updatedAt: string;
  updatedById: string | null;
};

export default function AdminThresholdsPage() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Edit modal state
  const [selectedThreshold, setSelectedThreshold] = useState<Threshold | null>(null);
  const [newValue, setNewValue] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { run, reauthOpen, setReauthOpen, handleReauthSuccess } = useAdminAction();

  const loadThresholds = () => {
    setLoading(true);
    adminFetch('/api/admin/thresholds').then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        setThresholds((res.data as { thresholds: Threshold[] }).thresholds);
      }
    });
  };

  useEffect(() => {
    loadThresholds();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreshold) return;

    setSaving(true);
    setFeedback(null);
    try {
      await run(`/api/admin/thresholds/${selectedThreshold.key}`, {
        method: 'PATCH',
        body: JSON.stringify({
          value: Number(newValue),
          reason: reason.trim() || 'Mise à jour seuil admin',
        }),
      });
      setFeedback({ type: 'success', msg: `Seuil ${selectedThreshold.key} mis à jour avec succès.` });
      setSelectedThreshold(null);
      loadThresholds();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la modification du seuil.';
      setFeedback({
        type: 'error',
        msg,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seuils Anti-Fraude</h1>
        <p className="text-sm text-slate-600">
          Configuration des garde-fous de l&apos;application. Les valeurs doivent impérativement respecter les bornes [Plancher, Plafond].
        </p>
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
              <th className="px-4 py-3">Clé du seuil</th>
              <th className="px-4 py-3">Valeur actuelle</th>
              <th className="px-4 py-3">Plancher (min)</th>
              <th className="px-4 py-3">Plafond (max)</th>
              <th className="px-4 py-3">Dernière modif</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : thresholds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Aucun seuil configuré.
                </td>
              </tr>
            ) : (
              thresholds.map((t) => (
                <tr key={t.key} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">
                    {t.key}
                  </td>
                  <td className="px-4 py-3 font-semibold text-sage-800">
                    {t.value}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {t.floor}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {t.ceiling}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(t.updatedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedThreshold(t);
                        setNewValue(t.value);
                        setReason('');
                      }}
                    >
                      Modifier
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Edit Threshold Sheet */}
      <Sheet
        open={Boolean(selectedThreshold)}
        onOpenChange={(o) => !o && setSelectedThreshold(null)}
      >
        {selectedThreshold && (
          <form onSubmit={handleSave} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Modifier le seuil : {selectedThreshold.key}
            </h2>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-slate-600">
              <p>
                Plancher strict : <strong>{selectedThreshold.floor}</strong>
              </p>
              <p>
                Plafond strict : <strong>{selectedThreshold.ceiling}</strong>
              </p>
              <p className="text-slate-400 italic">
                Toute valeur inférieure à {selectedThreshold.floor} ou supérieure à {selectedThreshold.ceiling} sera rejetée (erreur 403 SSH only).
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Nouvelle valeur</label>
              <Input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Motif de la modification</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Ajustement suite au pic de trafic..."
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={saving}
              disabled={!reason.trim()}
            >
              Enregistrer la modification
            </Button>
          </form>
        )}
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
