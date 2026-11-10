'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/components/providers/SessionProvider';
import { Sparkles, Loader2 } from 'lucide-react';

export function AdminTestProToggle() {
  const { user, refresh } = useCurrentUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'ADMIN') return null;

  const isPro = user.proUntil ? new Date(user.proUntil) > new Date() : false;

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/toggle-pro-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
      });
      if (res.ok) {
        await refresh();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={
        isPro
          ? 'Compte en mode Pro (Test) — Cliquez pour repasser en Gratuit'
          : 'Compte en mode Gratuit (Test) — Cliquez pour passer en Pro'
      }
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all shadow-xs cursor-pointer ${
        isPro
          ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
          : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
      }`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className={`h-3 w-3 ${isPro ? 'text-amber-600' : 'text-slate-400'}`} />
      )}
      <span>{isPro ? '👑 Pro (Test)' : '🧪 Gratuit (Test)'}</span>
      <span className="text-[10px] opacity-60 ml-0.5">⇄</span>
    </button>
  );
}
