import { describe, it, expect } from 'vitest';
import { encryptBuffer, decryptBuffer } from '@/lib/uploads/crypto';

describe('Uploads crypto (AES-256-GCM)', () => {
  it('chiffre et déchiffre un buffer correctement', () => {
    const plain = Buffer.from('Contenu de test pour upload sécurisé', 'utf-8');
    const encrypted = encryptBuffer(plain);

    expect(encrypted).not.toEqual(plain);
    expect(encrypted.length).toBeGreaterThan(plain.length);

    const decrypted = decryptBuffer(encrypted);
    expect(decrypted.toString('utf-8')).toBe(plain.toString('utf-8'));
  });

  it('génère un ciphertext différent pour chaque chiffrement (IV aléatoire)', () => {
    const plain = Buffer.from('Même texte', 'utf-8');
    const enc1 = encryptBuffer(plain);
    const enc2 = encryptBuffer(plain);

    expect(enc1.equals(enc2)).toBe(false);
    expect(decryptBuffer(enc1).equals(decryptBuffer(enc2))).toBe(true);
  });

  it('échoue si le buffer chiffré est altéré ou trop court', () => {
    expect(() => decryptBuffer(Buffer.alloc(10))).toThrow('ENCRYPTED_BUFFER_TOO_SHORT');

    const plain = Buffer.from('Donnée intègre', 'utf-8');
    const encrypted = encryptBuffer(plain);

    // Altération d'un octet dans le payload
    encrypted[encrypted.length - 1] = (encrypted[encrypted.length - 1] ?? 0) ^ 0xff;
    expect(() => decryptBuffer(encrypted)).toThrow();
  });
});
