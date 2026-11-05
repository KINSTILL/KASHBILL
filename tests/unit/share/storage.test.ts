import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSharePrefs,
  saveSharePrefs,
  saveCustomMessage,
  clearCustomMessage,
  getShareGroup,
} from '@/lib/share/storage';
import { createLocalStorageMock } from '../../helpers/localstorage';

beforeEach(() => {
  global.localStorage = createLocalStorageMock();
});

describe('loadSharePrefs', () => {
  it('retourne les valeurs par défaut si localStorage vide', () => {
    const prefs = loadSharePrefs();
    expect(prefs.lastTone).toBe('transparency');
    expect(prefs.lastDistance).toBe('tu');
    expect(prefs.customMessages).toEqual({});
  });

  it('retourne les valeurs par défaut si JSON corrompu', () => {
    localStorage.setItem('mycashbill:share-prefs:v1', 'not-json');
    const prefs = loadSharePrefs();
    expect(prefs.lastTone).toBe('transparency');
  });

  it('retourne les valeurs par défaut si version inconnue', () => {
    localStorage.setItem('mycashbill:share-prefs:v1', JSON.stringify({ version: 99 }));
    const prefs = loadSharePrefs();
    expect(prefs.lastTone).toBe('transparency');
  });
});

describe('saveSharePrefs / loadSharePrefs', () => {
  it('persiste et recharge correctement', () => {
    saveSharePrefs({
      version: 1,
      lastTone: 'pro',
      lastDistance: 'vous',
      customMessages: {},
      updatedAt: new Date().toISOString(),
    });
    const prefs = loadSharePrefs();
    expect(prefs.lastTone).toBe('pro');
    expect(prefs.lastDistance).toBe('vous');
  });
});

describe('saveCustomMessage / clearCustomMessage', () => {
  it('sauvegarde un message custom par groupe', () => {
    saveCustomMessage('DEVIS_PROFORMA', 'Mon message perso');
    const prefs = loadSharePrefs();
    expect(prefs.customMessages.DEVIS_PROFORMA).toBe('Mon message perso');
  });

  it('efface un message custom', () => {
    saveCustomMessage('DEVIS_PROFORMA', 'Test');
    clearCustomMessage('DEVIS_PROFORMA');
    const prefs = loadSharePrefs();
    expect(prefs.customMessages.DEVIS_PROFORMA).toBeUndefined();
  });
});

describe('getShareGroup', () => {
  it.each([
    ['DEVIS', 'DEVIS_PROFORMA'],
    ['PROFORMA', 'DEVIS_PROFORMA'],
    ['FACTURE', 'FACTURE_BON_COMMANDE'],
    ['BON_COMMANDE', 'FACTURE_BON_COMMANDE'],
    ['BORDEREAU', 'FACTURE_BON_COMMANDE'],
    ['RECU', 'RECU_TICKET'],
    ['TICKET', 'RECU_TICKET'],
  ])('%s → %s', (docType, expected) => {
    expect(getShareGroup(docType)).toBe(expected);
  });
});

