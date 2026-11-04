import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl } from '@/lib/share/whatsapp';

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

  it('URL-encode les caractères spéciaux du message', () => {
    const special = 'Bonjour ! Comment ça va ? 😊 #test';
    const url = buildWhatsAppUrl('699123456', special);
    expect(url).toContain(encodeURIComponent(special));
    expect(url).not.toContain(' ');
  });
});

