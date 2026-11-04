'use client';

import { listQueuedRequests, removeQueuedRequest, incrementRetry } from './drafts';

const MAX_RETRIES = 3;

/**
 * Vide la file d'attente. À appeler quand le réseau revient.
 */
export async function flushQueue(): Promise<{ processed: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  const queue = await listQueuedRequests();
  let processed = 0;
  let failed = 0;

  for (const req of queue) {
    if (req.retryCount >= MAX_RETRIES) {
      failed++;
      continue;
    }
    try {
      const res = await fetch(req.endpoint, {
        method: req.method,
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: req.method !== 'DELETE' ? JSON.stringify(req.body) : undefined,
      });
      if (res.ok) {
        await removeQueuedRequest(req.id);
        processed++;
      } else {
        await incrementRetry(req.id);
        failed++;
      }
    } catch {
      await incrementRetry(req.id);
      failed++;
    }
  }

  return { processed, failed };
}

