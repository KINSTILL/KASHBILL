'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAdminAction } from '@/lib/hooks/useAdminAction';
import { ReauthSheet } from '@/components/admin/ReauthSheet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';

type FraudFlag = {
  id: string;
  userId: string | null;
  documentId: string | null;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'CONFIRMED' | 'DISMISSED';
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
    businessName: string | null;
    taxId: string | null;
  } | null;
  document: {
    id: string;
    number: string;
    contentHash: string | null;
  } | null;
};

export default function AdminFraudPage() {
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'CONFIRMED' | 'DISMISSED' | ''>('PENDING');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Selected Flag for Modal
  const [selectedFlag, setSelectedFlag] = useState<FraudFlag | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [dismissModalOpen, setDismissModalOpen] = useState(false);

  // Form states
  const [actionReason, setActionReason] = useState('');
  const [blacklistPhone, setBlacklistPhone] = useState(true);
  const [blacklistTaxId, setBlacklistTaxId] = useState(false);
  const [banUser, setBanUser] = useState(false);
  const [revokeDocument, setRevokeDocument] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const { run, reauthOpen, setReauthOpen, handleReauthSuccess } = useAdminAction();

  const loadFlags = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);

    adminFetch(`/api/admin/fraud?${params.toString()}`).then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        setFlags((res.data as { flags: FraudFlag[] }).flags);
      }
    });
  }, [statusFilter]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const handleConfirmFraud = async () => {
    if (!selectedFlag) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await run(`/api/admin/fraud/${selectedFlag.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          reason: actionReason.trim() || selectedFlag.reason,
          blacklistPhone,
          blacklistTaxId,
          revokeDocument,
          banUser,
        }),
      });
      setFeedback({ type: 'success', msg: 'Fraude confirmée avec succès.' });
      setConfirmModalOpen(false);
      setSelectedFlag(null);
      loadFlags();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la confirmation.';
      setFeedback({
        type: 'error',
        msg,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissFraud = async () => {
    if (!selectedFlag) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await run(`/api/admin/fraud/${selectedFlag.id}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({
          note: actionReason.trim() || 'Faux positif après vérification',
        }),
      });
      setFeedback({ type: 'success', msg: 'Signalement rejeté (faux positif).' });
      setDismissModalOpen(false);
      setSelectedFlag(null);
      loadFlags();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du rejet.';
      setFeedback({
        type: 'error',
        msg,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">File de Fraude</h1>
          <p className="text-sm text-slate-600">
            Examen des alertes et détections de comportements suspects.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {(['PENDING', 'CONFIRMED', 'DISMISSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                statusFilter === st
                  ? 'bg-sage-600 text-white border-sage-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'PENDING'
                ? 'En attente'
                : st === 'CONFIRMED'
                ? 'Confirmés'
                : 'Rejetés'}
            </button>
          ))}
        </div>
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
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Sévérité</th>
              <th className="px-4 py-3">Utilisateur / Document</th>
              <th className="px-4 py-3">Motif du signalement</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : flags.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Aucun signalement trouvé.
                </td>
              </tr>
            ) : (
              flags.map((flag) => {
                const sevBadge =
                  flag.severity === 'CRITICAL'
                    ? 'bg-red-100 text-red-800 font-bold'
                    : flag.severity === 'HIGH'
                    ? 'bg-orange-100 text-orange-800 font-semibold'
                    : flag.severity === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600';

                return (
                  <tr key={flag.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(flag.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${sevBadge}`}>
                        {flag.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {flag.user ? (
                        <div>
                          <span className="font-semibold text-slate-900">
                            {flag.user.phone}
                          </span>
                          <span className="text-slate-400 ml-1">
                            ({flag.user.name ?? flag.user.businessName ?? 'Utilisateur'})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Utilisateur supprimé</span>
                      )}
                      {flag.document && (
                        <div className="text-slate-500">
                          Doc : <span className="font-mono">{flag.document.number}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-800 max-w-xs">
                      <div className="font-medium">{flag.reason}</div>
                      {flag.metadata && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {JSON.stringify(flag.metadata)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-semibold ${
                          flag.status === 'CONFIRMED'
                            ? 'bg-red-100 text-error'
                            : flag.status === 'DISMISSED'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {flag.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {flag.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedFlag(flag);
                              setActionReason(flag.reason);
                              setConfirmModalOpen(true);
                            }}
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFlag(flag);
                              setActionReason('');
                              setDismissModalOpen(true);
                            }}
                          >
                            Rejeter
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Confirm Fraud Sheet */}
      <Sheet
        open={confirmModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmModalOpen(false);
            setSelectedFlag(null);
          }
        }}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-error">Confirmer la fraude</h2>
          <p className="text-sm text-slate-600">
            La confirmation appliquera les sanctions sélectionnées et enregistrera une entrée dans le registre d&apos;audit.
          </p>

          <div>
            <label className="text-xs font-medium text-slate-700">Raison confirmée</label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Ex: Contrefaçon de document, numéro usurpé..."
            />
          </div>

          <div className="space-y-2 border-t pt-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={blacklistPhone}
                onChange={(e) => setBlacklistPhone(e.target.checked)}
                className="rounded text-sage-600"
              />
              Ajouter le numéro de téléphone à la Blacklist
            </label>

            {selectedFlag?.user?.taxId && (
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blacklistTaxId}
                  onChange={(e) => setBlacklistTaxId(e.target.checked)}
                  className="rounded text-sage-600"
                />
                Ajouter le NUI/RCCM à la Blacklist
              </label>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={revokeDocument}
                onChange={(e) => setRevokeDocument(e.target.checked)}
                className="rounded text-sage-600"
              />
              Révoquer l&apos;authenticité du document public
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={banUser}
                onChange={(e) => setBanUser(e.target.checked)}
                className="rounded text-sage-600"
              />
              Bannir définitivement l&apos;utilisateur
            </label>
          </div>

          <Button
            variant="danger"
            fullWidth
            isLoading={actionLoading}
            onClick={handleConfirmFraud}
          >
            Confirmer la fraude
          </Button>
        </div>
      </Sheet>

      {/* Dismiss Fraud Sheet */}
      <Sheet
        open={dismissModalOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDismissModalOpen(false);
            setSelectedFlag(null);
          }
        }}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Rejeter l&apos;alerte (Faux positif)</h2>
          <p className="text-sm text-slate-600">
            L&apos;alerte sera marquée comme rejetée sans impact sur l&apos;utilisateur.
          </p>

          <div>
            <label className="text-xs font-medium text-slate-700">Note d&apos;examen</label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Ex: Utilisateur vérifié par téléphone, faux positif..."
            />
          </div>

          <Button
            variant="primary"
            fullWidth
            isLoading={actionLoading}
            onClick={handleDismissFraud}
          >
            Confirmer le rejet
          </Button>
        </div>
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
