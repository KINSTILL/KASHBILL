'use client';

import { useEffect, useRef } from 'react';

type WakeLockSentinel = {
  release: () => Promise<void>;
  released: boolean;
};

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    const nav = navigator as unknown as {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> };
    };
    if (!nav.wakeLock) return;

    let cancelled = false;

    async function acquire() {
      if (!active) return;
      try {
        const sentinel = await nav.wakeLock!.request('screen');
        if (cancelled) {
          await sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // silencieux
      }
    }

    async function release() {
      if (sentinelRef.current && !sentinelRef.current.released) {
        try { await sentinelRef.current.release(); } catch {}
      }
      sentinelRef.current = null;
    }

    if (active) acquire();
    else release();

    return () => {
      cancelled = true;
      release();
    };
  }, [active]);
}

