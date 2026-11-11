import { describe, it, expect } from 'vitest';
import {
  buildDocumentShareUrl,
  signDocumentShareToken,
  verifyDocumentShareToken,
} from '@/lib/share/pdf-token';

describe('signDocumentShareToken', () => {
  it('produit un jeton hexadécimal de 32 caractères', () => {
    const token = signDocumentShareToken('doc_1');
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('est déterministe pour un même document', () => {
    expect(signDocumentShareToken('doc_1')).toBe(signDocumentShareToken('doc_1'));
  });

  it('diffère selon le document', () => {
    expect(signDocumentShareToken('doc_1')).not.toBe(signDocumentShareToken('doc_2'));
  });
});

describe('verifyDocumentShareToken', () => {
  it('accepte le jeton émis par signDocumentShareToken', () => {
    const token = signDocumentShareToken('doc_1');
    expect(verifyDocumentShareToken('doc_1', token)).toBe(true);
  });

  it('rejette un jeton appartenant à un autre document', () => {
    const token = signDocumentShareToken('doc_2');
    expect(verifyDocumentShareToken('doc_1', token)).toBe(false);
  });

  it('rejette un jeton vide, tronqué ou de mauvaise longueur', () => {
    expect(verifyDocumentShareToken('doc_1', '')).toBe(false);
    expect(verifyDocumentShareToken('doc_1', signDocumentShareToken('doc_1').slice(0, 31))).toBe(
      false
    );
    expect(verifyDocumentShareToken('doc_1', 'a'.repeat(64))).toBe(false);
  });

  it('rejette un jeton altéré', () => {
    const token = signDocumentShareToken('doc_1');
    const tampered = `${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`;
    expect(verifyDocumentShareToken('doc_1', tampered)).toBe(false);
  });
});

describe('buildDocumentShareUrl', () => {
  it("construit l'URL publique de téléchargement", () => {
    const url = buildDocumentShareUrl('https://app.example.com', 'doc_1');
    expect(url).toBe(
      `https://app.example.com/api/public/documents/doc_1/pdf?t=${signDocumentShareToken('doc_1')}`
    );
  });

  it('supprime le slash final de l’origine', () => {
    const url = buildDocumentShareUrl('https://app.example.com/', 'doc_1');
    expect(url.startsWith('https://app.example.com/api/')).toBe(true);
    expect(url).not.toContain('//api');
  });

  it('accepte un jeton fourni explicitement', () => {
    const url = buildDocumentShareUrl('http://localhost:3000', 'doc_1', 'deadbeef');
    expect(url).toBe('http://localhost:3000/api/public/documents/doc_1/pdf?t=deadbeef');
  });
});
