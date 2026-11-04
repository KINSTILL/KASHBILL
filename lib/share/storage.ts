'use client';

import { SHARE_PREFS_STORAGE_KEY } from '@/lib/constants';

export type ShareTone = 'transparency' | 'pro' | 'casual';
export type ShareDistance = 'tu' | 'vous';
export type ShareGroup = 'DEVIS_PROFORMA' | 'FACTURE_BON_COMMANDE' | 'RECU_TICKET';

export type SharePrefs = {
  version: 1;
  lastTone: ShareTone;
  lastDistance: ShareDistance;
  customMessages: Partial<Record<ShareGroup, string>>;
  updatedAt: string;
};

const DEFAULT_PREFS: SharePrefs = {
  version: 1,
  lastTone: 'transparency',
  lastDistance: 'tu',
  customMessages: {},
  updatedAt: new Date().toISOString(),
};

export function loadSharePrefs(): SharePrefs {
  try {
    const raw = localStorage.getItem(SHARE_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    if (
      parsed?.version !== 1 ||
      !['transparency', 'pro', 'casual'].includes(parsed.lastTone) ||
      !['tu', 'vous'].includes(parsed.lastDistance) ||
      typeof parsed.customMessages !== 'object'
    ) {
      return DEFAULT_PREFS;
    }
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveSharePrefs(prefs: SharePrefs): void {
  try {
    localStorage.setItem(
      SHARE_PREFS_STORAGE_KEY,
      JSON.stringify({ ...prefs, updatedAt: new Date().toISOString() })
    );
  } catch {
    // silencieux
  }
}

export function saveCustomMessage(group: ShareGroup, message: string): void {
  const prefs = loadSharePrefs();
  saveSharePrefs({ ...prefs, customMessages: { ...prefs.customMessages, [group]: message } });
}

export function clearCustomMessage(group: ShareGroup): void {
  const prefs = loadSharePrefs();
  const next = { ...prefs.customMessages };
  delete next[group];
  saveSharePrefs({ ...prefs, customMessages: next });
}

export function getShareGroup(docType: string): ShareGroup {
  switch (docType) {
    case 'DEVIS':
    case 'PROFORMA':
      return 'DEVIS_PROFORMA';
    case 'FACTURE':
    case 'BON_COMMANDE':
    case 'BORDEREAU':
      return 'FACTURE_BON_COMMANDE';
    case 'RECU':
    case 'TICKET':
    default:
      return 'RECU_TICKET';
  }
}

