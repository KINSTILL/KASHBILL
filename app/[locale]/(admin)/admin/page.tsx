'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PlatformAnnouncement } from '@/lib/announcements';

type Stats = {
  users: { total: number; active: number; banned: number; newToday: number };
  documents: { total: number; today: number; flagged: number };
  revenue: { totalFcfa: number; activeSubscriptions: number };
  referrals: { total: number; activated: number };
  fraud: { pendingFlags: number; confirmed: number; blacklistEntries: number };
};

function toLocalDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeAnn, setActiveAnn] = useState<PlatformAnnouncement | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [endsAtInput, setEndsAtInput] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [savingAnn, setSavingAnn] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/stats').then((r) => {
      if (r.ok) setStats(r.data as Stats);
    });
    adminFetch('/api/admin/announcements').then((r) => {
      if (r.ok) {
        const data = r.data as { announcement?: PlatformAnnouncement | null } | undefined;
        if (data?.announcement) {
          const a = data.announcement;
          setActiveAnn(a);
          setTitle(a.title);
          setMessage(a.message);
          setEndsAtInput(toLocalDateTimeInput(new Date(a.endsAt)));
        }
      }
    });
  }, []);

  const applyDurationDays = (days: number) => {
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setEndsAtInput(toLocalDateTimeInput(target));
  };

  const handlePublish = async () => {
    if (!title.trim() || !message.trim() || !endsAtInput) {
      setFeedback('Veuillez remplir le titre, le message et la date de fin.');
      return;
    }
    setSavingAnn(true);
    setFeedback(null);
    const res = await adminFetch('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({
        action: 'publish',
        title: title.trim(),
        message: message.trim(),
        endsAt: new Date(endsAtInput).toISOString(),
      }),
    });
    setSavingAnn(false);
    if (res.ok) {
      const data = res.data as { announcement?: PlatformAnnouncement | null } | undefined;
      setActiveAnn(data?.announcement ?? null);
      setFeedback('✅ Annonce publiée sur le Dashboard et la page Profil des utilisateurs.');
    } else {
      setFeedback(`❌ ${res.error ?? 'Erreur lors de la publication'}`);
    }
  };

  const handleClear = async () => {
    setSavingAnn(true);
    setFeedback(null);
    const res = await adminFetch('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({ action: 'clear' }),
    });
    setSavingAnn(false);
    if (res.ok) {
      setActiveAnn(null);
      setFeedback('🗑️ Annonce retirée immédiatement pour tous les utilisateurs.');
    } else {
      setFeedback(`❌ ${res.error ?? 'Erreur lors de la suppression'}`);
    }
  };

  if (!stats) return <p className="p-4 text-slate-500">Chargement…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs text-slate-500">Utilisateurs</p>
          <p className="text-2xl font-bold">{stats.users.total}</p>
          <p className="text-xs text-slate-400">
            {stats.users.active} actifs · {stats.users.banned} bannis
          </p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Nouveaux (aujourd&apos;hui)</p>
          <p className="text-2xl font-bold">{stats.users.newToday}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Documents</p>
          <p className="text-2xl font-bold">{stats.documents.total}</p>
          <p className="text-xs text-slate-400">{stats.documents.today} aujourd&apos;hui</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Revenus cumulés</p>
          <p className="text-2xl font-bold">{stats.revenue.totalFcfa.toLocaleString()} FCFA</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Abonnements actifs</p>
          <p className="text-2xl font-bold">{stats.revenue.activeSubscriptions}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Parrainages activés</p>
          <p className="text-2xl font-bold">
            {stats.referrals.activated} / {stats.referrals.total}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Fraude en attente</p>
          <p className="text-2xl font-bold text-error">{stats.fraud.pendingFlags}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">Blacklist</p>
          <p className="text-2xl font-bold">{stats.fraud.blacklistEntries}</p>
        </Card>
      </div>

      {/* Diffusion d'annonces globales */}
      <Card className="space-y-4 border border-emerald-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              📢 Annonce globale aux utilisateurs
            </h2>
            <p className="text-xs text-slate-500">
              S&apos;affiche sur le Dashboard (fermable par l&apos;utilisateur) et en haut de la page
              Profil (persistante jusqu&apos;à expiration ou retrait).
            </p>
          </div>
          {activeAnn ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              🟢 En ligne jusqu&apos;au{' '}
              {new Date(activeAnn.endsAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              ⚪ Aucune annonce active
            </span>
          )}
        </div>

        <div className="space-y-3">
          <Input
            label="Titre de l'annonce"
            placeholder="Ex : Nouveauté MyCashBill / Offre spéciale / Maintenance prévue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Message de l&apos;annonce
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Rédigez votre message à destination des utilisateurs..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Période / Date d&apos;expiration de l&apos;annonce
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: '+24h', days: 1 },
                { label: '+3 jours', days: 3 },
                { label: '+7 jours', days: 7 },
                { label: '+14 jours', days: 14 },
                { label: '+30 jours', days: 30 },
              ].map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => applyDurationDays(preset.days)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
              <input
                type="datetime-local"
                value={endsAtInput}
                onChange={(e) => setEndsAtInput(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800"
              />
            </div>
          </div>

          {feedback && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800">
              {feedback}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" onClick={handlePublish} isLoading={savingAnn}>
              {activeAnn ? "Mettre à jour l'annonce" : "Publier l'annonce"}
            </Button>
            {activeAnn && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={savingAnn}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Retirer l&apos;annonce
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
