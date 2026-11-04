'use client';

export type HapticType = 'light' | 'medium' | 'heavy';

const DURATIONS: Record<HapticType, number> = { light: 10, medium: 20, heavy: 40 };

export function haptic(type: HapticType = 'light'): void {
  if (typeof navigator === 'undefined') return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(DURATIONS[type]);
    } catch {
      // ignore
    }
  }
}

