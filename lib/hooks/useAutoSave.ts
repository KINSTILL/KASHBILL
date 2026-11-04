'use client';

import { useEffect, useRef, useState } from 'react';
import { saveDraft, type Draft } from '@/lib/storage/drafts';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(
  draftId: string,
  type: Draft['type'],
  value: T,
  debounceMs = 2000
) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initial = useRef(true);

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setStatus('saving');
    timer.current = setTimeout(async () => {
      try {
        await saveDraft({
          id: draftId,
          type,
          payload: value,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncStatus: 'local',
        });
        setStatus('saved');
        setLastSavedAt(Date.now());
      } catch {
        setStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draftId, type, value, debounceMs]);

  return { status, lastSavedAt };
}

