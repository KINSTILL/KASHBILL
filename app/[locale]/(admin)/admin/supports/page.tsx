'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAdminAction } from '@/lib/hooks/useAdminAction';
import { ReauthSheet } from '@/components/admin/ReauthSheet';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';

type SupportUser = {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  createdAt: string;
  lastAdminLoginAt: string | null;
  bannedAt: string | null;
};

export default function AdminSupportsPage() {
  const [supports, setSupports] = useState<SupportUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Creation form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recovery codes display state
  const [createdRecoveryCodes, setCreatedRecoveryCodes] = useState<string[] | null>(null);

  const { run, reauthOpen, setReauthOpen, handleReauthSuccess } = useAdminAction();

  const loadSupports = () => {
    setLoading(true);
    adminFetch('/api/admin/supports').then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        setSupports((res.data as { supports: SupportUser[] }).supports);
      }
    });
  };

  useEffect(() => {
    loadSupports();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = (await run('/api/admin/supports', {
        method: 'POST',
        body: JSON.stringify({
          phone: phone.trim(),
          pin: pin.trim(),
          name: name.trim(),
        }),
      })) as { support: { id: string; phone: string; name: string }; recoveryCodes: string[] };

      setFeedback({ type: 'success', msg: `Compte SUPPORT créé pour ${res.support.phone}.` });
      setIsAddOpen(false);
      setPhone('');
      setName('');
      setPin('');
      setCreatedRecoveryCodes(res.recoveryCodes);
      loadSupports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du compte SUPPORT.';
      setFeedback({
        type: 'error',
        msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string, supportPhone: string) => {
    if (!confirm(`Rétrograder le support ${supportPhone} au rôle USER ?`)) return;
    setFeedback(null);
    try {
      await run(`/api/admin/supports/${id}`, {
        method: 'DELETE',
      });
      setFeedback({ type: 'success', msg: `Accès SUPPORT révoqué pour ${supportPhone}.` });
      loadSupports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la révocation.';
      setFeedback({
        type: 'error',
        msg,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Comptes SUPPORT ({supports.length})</h1>
          <p className="text-sm text-slate-600">
            Gestion des opérateurs du service client et modération (ADMIN uniquement).
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
          + Nouveau compte SUPPORT
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
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : supports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aucun compte support actif.
                </td>
              </tr>
            ) : (
              supports.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                    {s.phone}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {s.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      SUPPORT
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleRevoke(s.id, s.phone)}
                    >
                      Révoquer
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Add Support Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <form onSubmit={handleCreate} className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Créer un compte SUPPORT
          </h2>
          <p className="text-xs text-slate-600">
            L&apos;opérateur aura accès aux fiches clients, au déblocage d&apos;appareils et au reset de PIN avec audit.
          </p>

          <div>
            <label className="text-xs font-medium text-slate-700">Numéro de téléphone (+2376...)</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237699112233"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Nom complet</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">Code PIN initial (6 chiffres)</label>
            <Input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={submitting}
            disabled={!phone.startsWith('+2376') || phone.length !== 13 || pin.length !== 6 || !name.trim()}
          >
            Créer le compte SUPPORT
          </Button>
        </form>
      </Sheet>

      {/* Recovery Codes Modal (dismissible={false}) */}
      <Sheet
        open={Boolean(createdRecoveryCodes)}
        onOpenChange={(o) => !o && setCreatedRecoveryCodes(null)}
        dismissible={false}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Codes de secours du compte SUPPORT
          </h2>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800">
            ⚠️ Notez impérativement ces 8 codes maintenant. Ils ne seront plus jamais réaffichés.
          </div>
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-lg font-mono text-center text-sm">
            {createdRecoveryCodes?.map((code) => (
              <span key={code} className="bg-white p-2 rounded border text-slate-800">
                {code}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                if (createdRecoveryCodes) {
                  navigator.clipboard.writeText(createdRecoveryCodes.join('\n'));
                }
              }}
            >
              Copier les 8 codes
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => setCreatedRecoveryCodes(null)}
            >
              J&apos;ai bien noté les codes
            </Button>
          </div>
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
