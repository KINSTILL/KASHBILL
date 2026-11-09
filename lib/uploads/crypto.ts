import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '@/lib/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  return Buffer.from(env.UPLOAD_ENCRYPTION_KEY, 'hex');
}

/**
 * Chiffre un buffer avec AES-256-GCM.
 * Format retourné : IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
 */
export function encryptBuffer(plain: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Déchiffre un buffer chiffré par encryptBuffer.
 * Lance une erreur si l'auth tag ne correspond pas (fichier corrompu ou mauvaise clé).
 */
export function decryptBuffer(encrypted: Buffer): Buffer {
  if (encrypted.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('ENCRYPTED_BUFFER_TOO_SHORT');
  }
  const iv = encrypted.subarray(0, IV_LENGTH);
  const tag = encrypted.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = encrypted.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
