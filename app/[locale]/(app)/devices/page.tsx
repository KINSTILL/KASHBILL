'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Smartphone, Laptop, ArrowLeft, ShieldAlert, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

interface DeviceItem {
  deviceId: string;
  userAgent: string | null;
  lastSeenAt: string;
  lastIp: string | null;
  createdAt: string;
  isCurrent: boolean;
}

interface PendingApproval {
  id: string;
  newDeviceId: string;
  userAgent: string | null;
  createdAt: string;
}

export default function DevicesPage() {
  const t = useTranslations('devices');
  const commonT = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalCodes, setApprovalCodes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch {}
  }, []);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/device-approval/pending');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchDevices(), fetchApprovals()]).finally(() => {
      setLoading(false);
    });

    const interval = setInterval(() => {
      fetchApprovals();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDevices, fetchApprovals]);

  const handleRevoke = async (deviceId: string) => {
    const confirm = window.confirm(t('revokeConfirm'));
    if (!confirm) return;

    setActionLoading(deviceId);
    setError(null);

    try {
      const res = await fetch(`/api/auth/devices/${deviceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || commonT('error'));
        return;
      }

      if (data.loggedOut) {
        router.push(`/${locale}/login` as Route);
        return;
      }

      await fetchDevices();
    } catch {
      setError(commonT('error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (approvalId: string) => {
    const code = approvalCodes[approvalId];
    if (!code || code.trim().length !== 6) {
      setError('Entrez le code à 6 chiffres');
      return;
    }

    setActionLoading(approvalId);
    setError(null);

    try {
      const res = await fetch('/api/auth/device-approval/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId,
          code: code.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || commonT('error'));
        return;
      }

      await Promise.all([fetchDevices(), fetchApprovals()]);
      setApprovalCodes((prev) => {
        const next = { ...prev };
        delete next[approvalId];
        return next;
      });
    } catch {
      setError(commonT('error'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
            <Smartphone className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 truncate">
              {t('title')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Gérez vos sessions connectées et approuvez de nouveaux appareils.
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/settings` as Route}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 shrink-0 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{commonT('back')}</span>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending approvals section */}
      {approvals.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-sm font-bold text-amber-900">
              {t('pendingApprovals')} ({approvals.length})
            </h2>
          </div>

          <div className="space-y-3">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className="rounded-xl bg-white p-3.5 border border-amber-200 text-xs shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {appr.userAgent || 'Appareil mobile'}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Demandé le {new Date(appr.createdAt).toLocaleString(locale)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    placeholder="Code à 6 chiffres"
                    maxLength={6}
                    className="w-32 text-center font-mono text-xs"
                    value={approvalCodes[appr.id] || ''}
                    onChange={(e) =>
                      setApprovalCodes((prev) => ({
                        ...prev,
                        [appr.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={actionLoading === appr.id}
                    loading={actionLoading === appr.id}
                    onClick={() => handleApprove(appr.id)}
                  >
                    {t('approve')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active devices list */}
      <div className="space-y-2.5">
        <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          Appareils autorisés
        </h2>

        {loading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : devices.length === 0 ? (
          <Card className="p-6 text-center text-xs text-slate-500">
            {t('noDevices')}
          </Card>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            {devices.map((dev) => {
              const isMobileUA = /Mobile|Android|iPhone|iPad/i.test(dev.userAgent ?? '');
              return (
                <div
                  key={dev.deviceId}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        dev.isCurrent
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200/80'
                      }`}
                    >
                      {isMobileUA ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Laptop className="h-5 w-5" />
                      )}
                    </span>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 truncate max-w-[220px] sm:max-w-md">
                          {dev.userAgent || 'Navigateur'}
                        </span>
                        {dev.isCurrent && (
                          <Badge variant="success" size="sm">
                            {t('current')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {t('lastSeen')} :{' '}
                        {new Date(dev.lastSeenAt).toLocaleString(locale)}
                        {dev.lastIp ? ` • IP: ${dev.lastIp}` : ''}
                      </p>
                    </div>
                  </div>

                  {!dev.isCurrent && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading === dev.deviceId}
                      loading={actionLoading === dev.deviceId}
                      onClick={() => handleRevoke(dev.deviceId)}
                      className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t('revoke')}</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

