'use client';

import { useState } from 'react';
import { RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/device/haptics';

export function WhatsAppRefreshButton({
  variant = 'pill',
  size = 'sm',
  instanceName,
  className = '',
  showLabel = true,
  onSuccess,
}: {
  variant?: 'pill' | 'button' | 'icon';
  size?: 'xs' | 'sm' | 'md';
  instanceName?: string;
  className?: string;
  showLabel?: boolean;
  onSuccess?: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleRefresh = async () => {
    if (loading) return;
    haptic('medium');
    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/whatsapp/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'fetch',
        },
        body: JSON.stringify({ instanceName }),
      });

      const data = await res.json();

      if (res.ok && data?.ok) {
        setStatus('success');
        haptic('medium');
        toast.show(
          data.message || 'WhatsApp Evolution actualisé avec succès ! Nouveaux numéros synchronisés.',
          'success'
        );
        onSuccess?.();
      } else {
        setStatus('error');
        haptic('heavy');
        toast.show(
          data?.error?.message || data?.message || 'Erreur lors de l’actualisation de WhatsApp Evolution.',
          'error'
        );
      }
    } catch {
      setStatus('error');
      haptic('heavy');
      toast.show('Impossible de joindre le serveur pour actualiser WhatsApp.', 'error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const label = loading
    ? 'Actualisation...'
    : status === 'success'
    ? 'Synchronisé !'
    : 'Actualiser WhatsApp';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        title="Actualiser WhatsApp Evolution pour accepter les nouveaux numéros"
        className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors ${
          loading ? 'cursor-wait opacity-70' : 'cursor-pointer hover:bg-slate-100'
        } ${className}`}
      >
        <RotateCw className={`h-4 w-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition shadow-xs hover:bg-emerald-100 active:scale-98 disabled:opacity-60 cursor-pointer ${className}`}
      >
        <RotateCw className={`h-3.5 w-3.5 text-emerald-600 shrink-0 ${loading ? 'animate-spin' : ''}`} />
        <span>{showLabel ? label : ''}</span>
      </button>
    );
  }

  // Variant "pill" (par défaut, idéal pour le Cockpit Admin et les barres d'outils)
  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={loading}
      title="Relance l'instance Evolution API pour synchroniser et débloquer les nouveaux numéros de téléphone"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer ${
        status === 'success'
          ? 'border-emerald-400 bg-emerald-100 text-emerald-900'
          : status === 'error'
          ? 'border-rose-300 bg-rose-50 text-rose-800'
          : 'border-emerald-200 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
      } ${className}`}
    >
      {status === 'success' ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
      ) : status === 'error' ? (
        <AlertCircle className="h-3 w-3 text-rose-500 shrink-0" />
      ) : (
        <RotateCw className={`h-3 w-3 text-emerald-600 shrink-0 ${loading ? 'animate-spin' : ''}`} />
      )}
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}
