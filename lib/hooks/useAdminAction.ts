'use client';

import { useState, useCallback } from 'react';
import { adminFetch, type AdminFetchOptions } from '@/lib/admin/client';

export function useAdminAction() {
  const [reauthOpen, setReauthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    url: string;
    options: AdminFetchOptions;
    resolve: (v: unknown) => void;
    reject: (e: unknown) => void;
  } | null>(null);

  const run = useCallback(async (url: string, options: AdminFetchOptions = {}): Promise<unknown> => {
    const result = await adminFetch(url, options);
    if (result.ok) return result.data;

    if (result.reason === 'REAUTH_REQUIRED') {
      return new Promise((resolve, reject) => {
        setPendingAction({ url, options, resolve, reject });
        setReauthOpen(true);
      });
    }

    const err = result.error as { error?: { message?: string } } | undefined;
    throw new Error(result.reason === 'FORBIDDEN' ? 'Action non autorisée' : err?.error?.message ?? 'Erreur');
  }, []);

  const handleReauthSuccess = useCallback(async () => {
    if (!pendingAction) return;
    const { url, options, resolve, reject } = pendingAction;
    setPendingAction(null);
    try {
      const result = await adminFetch(url, options);
      if (result.ok) resolve(result.data);
      else {
        const err = result.error as { error?: { message?: string } } | undefined;
        reject(new Error(err?.error?.message ?? 'Action échouée'));
      }
    } catch (e) {
      reject(e);
    }
  }, [pendingAction]);

  return { run, reauthOpen, setReauthOpen, handleReauthSuccess };
}

