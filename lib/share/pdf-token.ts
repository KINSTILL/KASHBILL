import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';

/**
 * Jeton HMAC signant l'accès public au PDF chiffré d'un document.
 *
 * Ce module est volontairement hors de `app/api/**` : dans un fichier `route.ts`,
 * Next.js n'autorise que les exports de handlers HTTP (GET, POST, ...) et rejette
 * tout autre export ("... is not a valid Route export field"). La logique est donc
 * centralisée ici, importable par les routes et testable unitairement.
 */

const TOKEN_LENGTH = 32;

function computeToken(documentId: string): string {
  return createHmac('sha256', env.JWT_SECRET)
    .update(`share-pdf:${documentId}`)
    .digest('hex')
    .slice(0, TOKEN_LENGTH);
}

/** Signe l'identifiant d'un document et retourne le jeton de partage. */
export function signDocumentShareToken(documentId: string): string {
  return computeToken(documentId);
}

/** Vérifie un jeton de partage en temps constant (protection timing attack). */
export function verifyDocumentShareToken(documentId: string, token: string): boolean {
  if (typeof token !== 'string' || token.length !== TOKEN_LENGTH) return false;
  const expected = computeToken(documentId);
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Construit l'URL publique de téléchargement du PDF pour un document donné. */
export function buildDocumentShareUrl(
  origin: string,
  documentId: string,
  token: string = signDocumentShareToken(documentId)
): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/api/public/documents/${encodeURIComponent(documentId)}/pdf?t=${token}`;
}

/** Construit l'URL publique de téléchargement du XML pour un document donné (même jeton). */
export function buildDocumentXmlShareUrl(
  origin: string,
  documentId: string,
  token: string = signDocumentShareToken(documentId)
): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/api/public/documents/${encodeURIComponent(documentId)}/xml?t=${token}`;
}
