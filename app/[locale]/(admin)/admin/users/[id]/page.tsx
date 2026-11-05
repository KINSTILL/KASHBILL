'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useLocale } from 'next-intl';
import { adminFetch } from '@/lib/admin/client';
import { useAdminAction } from '@/lib/hooks/useAdminAction';
import { ReauthSheet } from '@/components/admin/ReauthSheet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';

type UserDetail = {
  id: string;
  phone: string;
  name: string | null;
  businessName: string | null;
  city: string | null;
  role: 'USER' | 'SUPPORT' | 'ADMIN';
  proUntil: string | null;
  pendingProDays: number;
  bannedAt: string | null;
  banReason: string | null;
  suspendedUntil: string | null;
  suspendReason: string | null;
  flaggedForReview: boolean;
  country: string;
  legalName: string | null;
  taxId: string | null;
  rccm: string | null;
  referralCode: string;
  duplicationsThisMonth: number;
  productPhotosCount: number;
  createdAt: string;
  lastAdminLoginAt: string | null;
  devices: {
    deviceId: string;
    userAgent: string | null;
    lastSeenAt: string;
    revokedAt: string | null;
  }[];
  subscriptions: {
    id: string;
    plan: string;
    amountXaf: number;
    source: string;
    createdAt: string;
    endsAt: string;
  }[];
  referralsMade: {
    id: string;
    status: string;
    createdAt: string;
    filleul: { phone: string } | null;
  }[];
  referralReceived: {
    status: string;
    parrain: { phone: string } | null;
  } | null;
  _count: {
    documents: number;
    clients: number;
  };
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modals & Action States
  const [activeModal, setActiveModal] = useState<
    'ban' | 'suspend' | 'grant_pro' | 'reset_pin' | 'flag' | null
  >(null);
  const [actionReason, setActionReason] = useState('');
  const [actionDays, setActionDays] = useState('30');
  const [newPin, setNewPin] = useState('');
  const [flagSeverity, setFlagSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [actionLoading, setActionLoading] = useState(false);
  const [resetPinSuccess, setResetPinSuccess] = useState<{ recoveryCodes: string[] } | null>(null);

  const { run, reauthOpen, setReauthOpen, handleReauthSuccess } = useAdminAction();

  const refreshUser = useCallback(() => {
    setLoading(true);
    adminFetch(`/api/admin/users/${id}`).then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        setUser((res.data as { user: UserDetail }).user);
      }
    });
  }, [id]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleAction = async (actionFn: () => Promise<unknown>) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await actionFn();
      setFeedback({ type: 'success', msg: 'Action exécutée avec succès.' });
      setActiveModal(null);
      setActionReason('');
      refreshUser();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur lors de l’exécution de l’action.';
      setFeedback({
        type: 'error',
        msg,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !user) return <div className="p-8 text-slate-500">Chargement…</div>;
  if (!user) return <div className="p-8 text-red-500">Utilisateur non trouvé.</div>;

  const isBanned = Boolean(user.bannedAt);
  const isSuspended = user.suspendedUntil && new Date(user.suspendedUntil) > new Date();
  const isPro = user.proUntil && new Date(user.proUntil) > new Date();

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/${locale}/admin/users` as Route}
            className="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            ← Retour à la liste des utilisateurs
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-slate-900">{user.phone}</h1>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                user.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-800'
                  : user.role === 'SUPPORT'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {user.role}
            </span>
            {isBanned && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-error">
                BANNI
              </span>
            )}
            {isSuspended && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                SUSPENDU
              </span>
            )}
            {user.flaggedForReview && (
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                FLAGGÉ
              </span>
            )}
          </div>
        </div>

        {/* Global Action buttons */}
        <div className="flex flex-wrap gap-2">
          {isBanned ? (
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() =>
                handleAction(() =>
                  run(`/api/admin/users/${id}/unban`, {
                    method: 'POST',
                    body: JSON.stringify({}),
                  })
                )
              }
            >
              Débannir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-error border-error/30 hover:bg-red-50"
              onClick={() =>
                handleAction(() =>
                  run(`/api/admin/users/${id}/ban`, {
                    method: 'POST',
                    body: JSON.stringify({ reason: 'Banni par administrateur' }),
                  })
                )
              }
            >
              Bannir
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModal('suspend')}
          >
            Suspendre
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveModal('grant_pro')}
          >
            Offrir Pro
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModal('reset_pin')}
          >
            Reset PIN
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveModal('flag')}
          >
            Signaler / Flag
          </Button>
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

      {/* Grid of info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 border-b pb-2">
            Profil & Entreprise
          </h2>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-slate-500">Nom :</span>{' '}
              <strong className="text-slate-800">{user.name ?? '—'}</strong>
            </p>
            <p>
              <span className="text-slate-500">Boutique :</span>{' '}
              <strong className="text-slate-800">{user.businessName ?? '—'}</strong>
            </p>
            <p>
              <span className="text-slate-500">Pays / Ville :</span>{' '}
              <span className="text-slate-800">
                {user.country} {user.city ? `(${user.city})` : ''}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Nom légal :</span>{' '}
              <span className="text-slate-800">{user.legalName ?? '—'}</span>
            </p>
            <p>
              <span className="text-slate-500">NUI / RCCM :</span>{' '}
              <span className="text-slate-800">
                {user.taxId ?? '—'} / {user.rccm ?? '—'}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Inscrit le :</span>{' '}
              <span className="text-slate-800">
                {new Date(user.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </p>
          </div>
        </Card>

        {/* Subscription & Activity Card */}
        <Card className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 border-b pb-2">
            Abonnement & Métriques
          </h2>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-slate-500">Statut Pro :</span>{' '}
              {isPro ? (
                <span className="text-success font-semibold">
                  Oui (jusqu&apos;au{' '}
                  {new Date(user.proUntil!).toLocaleDateString('fr-FR')})
                </span>
              ) : (
                <span className="text-slate-500">Plan Gratuit</span>
              )}
            </p>
            <p>
              <span className="text-slate-500">Jours Pro en attente :</span>{' '}
              <strong>{user.pendingProDays}</strong>
            </p>
            <p>
              <span className="text-slate-500">Documents créés :</span>{' '}
              <strong>{user._count.documents}</strong>
            </p>
            <p>
              <span className="text-slate-500">Clients enregistrés :</span>{' '}
              <strong>{user._count.clients}</strong>
            </p>
            <p>
              <span className="text-slate-500">Duplications ce mois :</span>{' '}
              <strong>{user.duplicationsThisMonth}</strong>
            </p>
            <p>
              <span className="text-slate-500">Photos de produits :</span>{' '}
              <strong>{user.productPhotosCount}</strong>
            </p>
          </div>
        </Card>

        {/* Referral Card */}
        <Card className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 border-b pb-2">
            Parrainage
          </h2>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-slate-500">Code parrain :</span>{' '}
              <strong className="font-mono">{user.referralCode}</strong>
            </p>
            <p>
              <span className="text-slate-500">Parrainé par :</span>{' '}
              <span className="text-slate-800">
                {user.referralReceived?.parrain?.phone ?? 'Aucun'}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Filleuls parrainés :</span>{' '}
              <strong>{user.referralsMade.length}</strong>
            </p>
          </div>
        </Card>
      </div>

      {/* Devices Section */}
      <Card className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Appareils ({user.devices.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 border-b">
              <tr>
                <th className="px-3 py-2">Device ID</th>
                <th className="px-3 py-2">User-Agent</th>
                <th className="px-3 py-2">Dernière activité</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {user.devices.map((d) => {
                const isRevoked = Boolean(d.revokedAt);
                return (
                  <tr key={d.deviceId}>
                    <td className="px-3 py-2 font-mono">{d.deviceId}</td>
                    <td className="px-3 py-2 text-slate-600 truncate max-w-xs">
                      {d.userAgent ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {new Date(d.lastSeenAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-2">
                      {isRevoked ? (
                        <span className="text-error font-medium">Révoqué</span>
                      ) : (
                        <span className="text-success font-medium">Actif</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!isRevoked && (
                        <button
                          type="button"
                          className="text-red-600 hover:underline"
                          onClick={() =>
                            handleAction(() =>
                              run(`/api/admin/users/${id}/unblock-device`, {
                                method: 'POST',
                                body: JSON.stringify({ deviceId: d.deviceId }),
                              })
                            )
                          }
                        >
                          Révoquer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Sheets / Modals */}
      {/* Ban Sheet */}
      <Sheet open={activeModal === 'ban'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-error">Bannir l&apos;utilisateur</h2>
          <p className="text-sm text-slate-600">
            Cette action déconnecte tous les appareils et interdit toute connexion future.
          </p>
          <div>
            <label className="text-xs font-medium text-slate-700">Raison du bannissement</label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Ex: Fraude avérée, faux documents..."
            />
          </div>
          <Button
            variant="danger"
            fullWidth
            isLoading={actionLoading}
            disabled={actionReason.trim().length < 3}
            onClick={() =>
              handleAction(() =>
                run(`/api/admin/users/${id}/ban`, {
                  method: 'POST',
                  body: JSON.stringify({ reason: actionReason.trim() }),
                })
              )
            }
          >
            Confirmer le bannissement
          </Button>
        </div>
      </Sheet>

      {/* Suspend Sheet */}
      <Sheet open={activeModal === 'suspend'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-amber-800">Suspendre l&apos;utilisateur</h2>
          <div>
            <label className="text-xs font-medium text-slate-700">Durée en jours</label>
            <Input
              type="number"
              value={actionDays}
              onChange={(e) => setActionDays(e.target.value)}
              min="1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Raison</label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Ex: Activité suspecte à vérifier..."
            />
          </div>
          <Button
            variant="primary"
            fullWidth
            isLoading={actionLoading}
            disabled={actionReason.trim().length < 3}
            onClick={() =>
              handleAction(() =>
                run(`/api/admin/users/${id}/suspend`, {
                  method: 'POST',
                  body: JSON.stringify({
                    days: parseInt(actionDays, 10),
                    reason: actionReason.trim(),
                  }),
                })
              )
            }
          >
            Confirmer la suspension
          </Button>
        </div>
      </Sheet>

      {/* Grant Pro Sheet */}
      <Sheet open={activeModal === 'grant_pro'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Offrir l&apos;abonnement Pro</h2>
          <div>
            <label className="text-xs font-medium text-slate-700">Durée en jours</label>
            <Input
              type="number"
              value={actionDays}
              onChange={(e) => setActionDays(e.target.value)}
              min="1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Motif</label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Ex: Geste commercial, partenariat..."
            />
          </div>
          <Button
            variant="primary"
            fullWidth
            isLoading={actionLoading}
            disabled={actionReason.trim().length < 3}
            onClick={() =>
              handleAction(() =>
                run(`/api/admin/users/${id}/grant-pro`, {
                  method: 'POST',
                  body: JSON.stringify({
                    days: parseInt(actionDays, 10),
                    reason: actionReason.trim(),
                  }),
                })
              )
            }
          >
            Accorder Pro
          </Button>
        </div>
      </Sheet>

      {/* Reset PIN Sheet */}
      <Sheet open={activeModal === 'reset_pin'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Réinitialiser le code PIN</h2>
          <p className="text-sm text-slate-600">
            Déconnecte les appareils du compte et génère 8 nouveaux codes de secours.
          </p>
          <div>
            <label className="text-xs font-medium text-slate-700">Nouveau PIN (6 chiffres)</label>
            <Input
              type="password"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
            />
          </div>
          <Button
            variant="primary"
            fullWidth
            isLoading={actionLoading}
            disabled={newPin.length !== 6}
            onClick={() =>
              handleAction(async () => {
                const res = (await run(`/api/admin/users/${id}/reset-pin`, {
                  method: 'POST',
                  body: JSON.stringify({ newPin }),
                })) as { recoveryCodes: string[] };
                setResetPinSuccess(res);
              })
            }
          >
            Appliquer le nouveau PIN
          </Button>
        </div>
      </Sheet>

      {/* Flag Sheet */}
      <Sheet open={activeModal === 'flag'} onOpenChange={(o) => !o && setActiveModal(null)}>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Signaler l&apos;utilisateur (Flag)</h2>
          <div>
            <label className="text-xs font-medium text-slate-700">Sévérité</label>
            <select
              value={flagSeverity}
              onChange={(e) =>
                setFlagSeverity(
                  e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
                )
              }
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="LOW">Faible (LOW)</option>
              <option value="MEDIUM">Moyenne (MEDIUM)</option>
              <option value="HIGH">Élevée (HIGH)</option>
              <option value="CRITICAL">Critique (CRITICAL)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">Raison</label>
            <Input
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Ex: Nombreuses duplications inhabituelles..."
            />
          </div>
          <Button
            variant="primary"
            fullWidth
            isLoading={actionLoading}
            disabled={actionReason.trim().length < 3}
            onClick={() =>
              handleAction(() =>
                run(`/api/admin/users/${id}/flag`, {
                  method: 'POST',
                  body: JSON.stringify({
                    reason: actionReason.trim(),
                    severity: flagSeverity,
                  }),
                })
              )
            }
          >
            Enregistrer le flag
          </Button>
        </div>
      </Sheet>

      {/* Recovery Codes Sheet (shown after PIN reset) */}
      <Sheet
        open={Boolean(resetPinSuccess)}
        onOpenChange={(o) => !o && setResetPinSuccess(null)}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Nouveaux codes de secours
          </h2>
          <p className="text-xs text-slate-600">
            Ces codes doivent être transmis de manière sécurisée à l&apos;utilisateur.
          </p>
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-lg font-mono text-center text-sm">
            {resetPinSuccess?.recoveryCodes.map((code) => (
              <span key={code} className="bg-white p-2 rounded border">
                {code}
              </span>
            ))}
          </div>
          <Button
            fullWidth
            variant="primary"
            onClick={() => setResetPinSuccess(null)}
          >
            Fermer
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
