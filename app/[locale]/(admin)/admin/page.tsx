'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { Card } from '@/components/ui/Card';

type Stats = {
  users: { total: number; active: number; banned: number; newToday: number };
  documents: { total: number; today: number; flagged: number };
  revenue: { totalFcfa: number; activeSubscriptions: number };
  referrals: { total: number; activated: number };
  fraud: { pendingFlags: number; confirmed: number; blacklistEntries: number };
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    adminFetch('/api/admin/stats').then((r) => {
      if (r.ok) setStats(r.data as Stats);
    });
  }, []);

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
    </div>
  );
}

