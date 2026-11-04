import { randomBytes } from 'node:crypto';

export function generatePublicToken(): string {
  return randomBytes(16).toString('base64url');
}

