import {
  ALLOWED_IMAGE_MIMES,
  MAX_LOGO_SIZE_BYTES,
  MAX_SIGNATURE_SIZE_BYTES,
  MAX_STAMP_SIZE_BYTES,
} from '@/lib/constants';

export type ImageKind = 'logo' | 'signature' | 'stamp';

const MAX_SIZES: Record<ImageKind, number> = {
  logo: MAX_LOGO_SIZE_BYTES,
  signature: MAX_SIGNATURE_SIZE_BYTES,
  stamp: MAX_STAMP_SIZE_BYTES,
};

// Signatures binaires (magic bytes) des formats acceptés
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

function startsWith(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

export function detectImageType(buffer: Buffer): 'image/png' | 'image/jpeg' | null {
  if (startsWith(buffer, PNG_SIGNATURE)) return 'image/png';
  if (startsWith(buffer, JPEG_SIGNATURE)) return 'image/jpeg';
  return null;
}

export type ImageValidationResult =
  | { ok: true; mime: 'image/png' | 'image/jpeg'; extension: 'png' | 'jpg' }
  | { ok: false; reason: 'TOO_LARGE' | 'INVALID_TYPE' | 'EMPTY' };

export function validateImage(buffer: Buffer, kind: ImageKind): ImageValidationResult {
  if (!buffer || buffer.length === 0) return { ok: false, reason: 'EMPTY' };
  if (buffer.length > MAX_SIZES[kind]) return { ok: false, reason: 'TOO_LARGE' };

  const mime = detectImageType(buffer);
  if (!mime || !ALLOWED_IMAGE_MIMES.includes(mime)) {
    return { ok: false, reason: 'INVALID_TYPE' };
  }

  return { ok: true, mime, extension: mime === 'image/png' ? 'png' : 'jpg' };
}

