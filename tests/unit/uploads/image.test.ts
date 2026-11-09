import { describe, it, expect } from 'vitest';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { saveImage, readImageFile, deleteImageByUrl } from '@/lib/uploads/image';

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
function makeFakePng(size: number): Buffer {
  return Buffer.concat([PNG_HEADER, Buffer.alloc(Math.max(0, size - PNG_HEADER.length))]);
}

describe('Uploads image handling with encryption & fallback', () => {
  const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

  it('sauvegarde une image en la chiffrant avec extension .enc', async () => {
    const fakePng = makeFakePng(100);
    const saveRes = await saveImage(fakePng, 'test-user', 'logo');

    expect(saveRes.ok).toBe(true);
    if (!saveRes.ok) return;

    expect(saveRes.url).toMatch(/^\/api\/uploads\/test-user-logo-.*\.png\.enc$/);
    expect(saveRes.absolutePath.endsWith('.enc')).toBe(true);

    // Lecture du fichier via readImageFile déchiffre automatiquement
    const filename = path.basename(saveRes.absolutePath);
    const readBuffer = await readImageFile(filename);
    expect(readBuffer.equals(fakePng)).toBe(true);

    // Nettoyage
    await deleteImageByUrl(saveRes.url);
  });

  it('lit un ancien fichier non chiffré via fallback rétrocompatible', async () => {
    const rawFilename = `test-legacy-${Date.now()}.png`;
    const rawPath = path.join(uploadsDir, rawFilename);
    const fakePng = makeFakePng(80);

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(rawPath, fakePng);

    try {
      // 1. Lecture avec le nom direct sans .enc
      const readDirect = await readImageFile(rawFilename);
      expect(readDirect.equals(fakePng)).toBe(true);

      // 2. Lecture si demandé avec extension .enc mais existant en clair
      const readViaEnc = await readImageFile(`${rawFilename}.enc`);
      expect(readViaEnc.equals(fakePng)).toBe(true);
    } finally {
      await unlink(rawPath).catch(() => {});
    }
  });
});
