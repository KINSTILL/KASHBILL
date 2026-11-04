import { describe, it, expect } from 'vitest';
import { validateImage, detectImageType } from '@/lib/validators/image';

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff]);

function makeFakePng(size: number): Buffer {
  return Buffer.concat([PNG_HEADER, Buffer.alloc(size - PNG_HEADER.length)]);
}

describe('detectImageType', () => {
  it('détecte PNG', () => {
    expect(detectImageType(makeFakePng(50))).toBe('image/png');
  });

  it('détecte JPEG', () => {
    expect(detectImageType(makeFakeJpeg(50))).toBe('image/jpeg');
  });

  it('retourne null pour un fichier inconnu', () => {
    expect(detectImageType(Buffer.from('hello world'))).toBeNull();
  });
});

function makeFakeJpeg(size: number): Buffer {
  return Buffer.concat([JPEG_HEADER, Buffer.alloc(size - JPEG_HEADER.length)]);
}

describe('validateImage', () => {
  it('accepte un PNG valide sous la limite logo (200 Ko)', () => {
    const result = validateImage(makeFakePng(1000), 'logo');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mime).toBe('image/png');
  });

  it('rejette un logo > 200 Ko', () => {
    const result = validateImage(makeFakePng(300 * 1024), 'logo');
    expect(result).toEqual({ ok: false, reason: 'TOO_LARGE' });
  });

  it('rejette une signature > 50 Ko', () => {
    const result = validateImage(makeFakePng(100 * 1024), 'signature');
    expect(result).toEqual({ ok: false, reason: 'TOO_LARGE' });
  });

  it('rejette un fichier texte renommé en PNG', () => {
    // Pas de magic bytes PNG → rejeté
    const fakePng = Buffer.from('This is not a real PNG file');
    const result = validateImage(fakePng, 'logo');
    expect(result).toEqual({ ok: false, reason: 'INVALID_TYPE' });
  });

  it('rejette un buffer vide', () => {
    const result = validateImage(Buffer.alloc(0), 'logo');
    expect(result).toEqual({ ok: false, reason: 'EMPTY' });
  });
});

