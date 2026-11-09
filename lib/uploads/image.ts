import { writeFile, unlink, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateImage, type ImageKind } from '@/lib/validators/image';
import { encryptBuffer, decryptBuffer } from './crypto';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

export type SaveImageResult =
  | { ok: true; url: string; absolutePath: string }
  | { ok: false; reason: 'TOO_LARGE' | 'INVALID_TYPE' | 'EMPTY' | 'IO_ERROR' };

export async function saveImage(
  buffer: Buffer,
  userId: string,
  kind: ImageKind
): Promise<SaveImageResult> {
  const validation = validateImage(buffer, kind);
  if (!validation.ok) return validation;

  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${userId}-${kind}-${randomUUID()}.${validation.extension}.enc`;
    const absolutePath = path.join(UPLOADS_DIR, filename);
    const encrypted = encryptBuffer(buffer);
    await writeFile(absolutePath, encrypted);
    return {
      ok: true,
      url: `/api/uploads/${filename}`,
      absolutePath,
    };
  } catch {
    return { ok: false, reason: 'IO_ERROR' };
  }
}

export async function deleteImageByUrl(url: string): Promise<void> {
  if (!url.startsWith('/api/uploads/')) return;
  const filename = url.slice('/api/uploads/'.length);
  const absolutePath = path.join(UPLOADS_DIR, filename);
  try {
    await unlink(absolutePath);
  } catch {
    // ignore
  }
}

/**
 * Lit un fichier upload.
 * Si le fichier demandé (ou son alternative .enc / sans .enc) existe :
 * - s'il est chiffré (.enc) → déchiffre via decryptBuffer.
 * - sinon → lit en clair (fallback legacy rétrocompatible).
 */
export async function readImageFile(filename: string): Promise<Buffer> {
  const absolutePath = path.join(UPLOADS_DIR, filename);

  try {
    const raw = await readFile(absolutePath);
    if (filename.endsWith('.enc')) {
      return decryptBuffer(raw);
    }
    return raw;
  } catch (err: unknown) {
    // Fallback 1 : foo.png demandé, mais seul foo.png.enc existe sur disque
    if (!filename.endsWith('.enc')) {
      try {
        const encRaw = await readFile(`${absolutePath}.enc`);
        return decryptBuffer(encRaw);
      } catch {
        // throw original err
      }
    }
    // Fallback 2 : foo.png.enc demandé, mais le fichier est encore en clair sur disque (foo.png)
    if (filename.endsWith('.enc')) {
      try {
        const legacyPath = absolutePath.replace(/\.enc$/, '');
        return await readFile(legacyPath);
      } catch {
        // throw original err
      }
    }
    throw err;
  }
}
