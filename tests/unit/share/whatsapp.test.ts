import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl } from '@/lib/share/whatsapp';
import { resolveShareMessage } from '@/lib/share/messages';

describe('buildWhatsAppUrl', () => {
  const msg = 'Hello world';

  it('construit une URL wa.me correcte pour un numéro local', () => {
    expect(buildWhatsAppUrl('699123456', msg)).toBe(
      `https://wa.me/237699123456?text=${encodeURIComponent(msg)}`
    );
  });

  it('gère un numéro avec indicatif', () => {
    expect(buildWhatsAppUrl('+237699123456', msg)).toBe(
      `https://wa.me/237699123456?text=${encodeURIComponent(msg)}`
    );
  });

  it('gère un numéro avec zéro initial', () => {
    expect(buildWhatsAppUrl('0699123456', msg)).toBe(
      `https://wa.me/237699123456?text=${encodeURIComponent(msg)}`
    );
  });

  it('gère un numéro vide en ouvrant le sélecteur de contact WhatsApp', () => {
    expect(buildWhatsAppUrl('', msg)).toBe(
      `https://wa.me/?text=${encodeURIComponent(msg)}`
    );
  });

  it('URL-encode les caractères spéciaux du message', () => {
    const special = 'Bonjour ! Comment ça va ? 😊 #test';
    const url = buildWhatsAppUrl('699123456', special);
    expect(url).toContain(encodeURIComponent(special));
    expect(url).not.toContain(' ');
  });
});

describe('resolveShareMessage', () => {
  const dummyT = (k: string) => k;

  it('retourne le bon message spécifique au type de document en FR', () => {
    expect(
      resolveShareMessage(dummyT, 'FACTURE_BON_COMMANDE', 'pro', 'vous', 'fr', undefined, 'BORDEREAU')
    ).toContain('bordereau de livraison');
    expect(
      resolveShareMessage(dummyT, 'FACTURE_BON_COMMANDE', 'pro', 'vous', 'fr', undefined, 'BON_COMMANDE')
    ).toContain('bon de commande');
    expect(
      resolveShareMessage(dummyT, 'FACTURE_BON_COMMANDE', 'pro', 'vous', 'fr', undefined, 'FACTURE')
    ).toContain('facture');
    expect(
      resolveShareMessage(dummyT, 'DEVIS_PROFORMA', 'pro', 'vous', 'fr', undefined, 'PROFORMA')
    ).toContain('proforma');
    expect(
      resolveShareMessage(dummyT, 'RECU_TICKET', 'casual', 'tu', 'fr', undefined, 'TICKET')
    ).toContain('ticket de caisse');
  });

  it('retourne le bon message spécifique au type de document en EN (tu et vous)', () => {
    expect(
      resolveShareMessage(dummyT, 'FACTURE_BON_COMMANDE', 'pro', 'vous', 'en', undefined, 'BORDEREAU')
    ).toContain('delivery note');
    expect(
      resolveShareMessage(dummyT, 'FACTURE_BON_COMMANDE', 'pro', 'tu', 'en', undefined, 'FACTURE')
    ).toContain('digital invoice');
  });
});
