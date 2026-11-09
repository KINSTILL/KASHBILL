import { createHash, randomInt } from 'node:crypto';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import { prisma } from '@/lib/db';

const RECOVERY_CODES_COUNT = 8;
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const ARGON_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  algorithm: 2, // Argon2id
} as const;

function generateOneCode(): string {
  let chars = '';
  for (let i = 0; i < 8; i++) {
    chars += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

function normalizeCode(code: string): string {
  return code.replace(/-/g, '').toUpperCase();
}

/** Legacy : hash SHA-256 (lecture seule) */
function legacySha256(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

function isArgonHash(h: string): boolean {
  return h.startsWith('$argon2id$');
}

function isSha256Hash(h: string): boolean {
  return /^[a-f0-9]{64}$/.test(h);
}

export function generateRecoveryCodes(): string[] {
  const set = new Set<string>();
  while (set.size < RECOVERY_CODES_COUNT) {
    set.add(generateOneCode());
  }
  return Array.from(set);
}

export async function createRecoveryCodes(userId: string): Promise<string[]> {
  const codes = generateRecoveryCodes();
  const hashedCodes = await Promise.all(
    codes.map(async (code) => ({
      userId,
      codeHash: await argon2Hash(normalizeCode(code), ARGON_OPTIONS),
    }))
  );
  await prisma.recoveryCode.createMany({ data: hashedCodes });
  return codes;
}

/**
 * Vérifie un code, le consomme, et migre transparentement vers argon2id
 * si c'était un ancien hash SHA-256.
 */
export async function verifyAndConsumeRecoveryCode(
  userId: string,
  code: string
): Promise<boolean> {
  const normalized = normalizeCode(code);

  const candidates = await prisma.recoveryCode.findMany({
    where: { userId, usedAt: null },
  });

  for (const candidate of candidates) {
    let matched = false;
    let needsRehash = false;

    if (isArgonHash(candidate.codeHash)) {
      try {
        matched = await argon2Verify(candidate.codeHash, normalized, ARGON_OPTIONS);
      } catch {
        matched = false;
      }
    } else if (isSha256Hash(candidate.codeHash)) {
      matched = legacySha256(normalized) === candidate.codeHash;
      needsRehash = matched;
    }

    if (!matched) continue;

    try {
      await prisma.$transaction(async (tx) => {
        const result = await tx.recoveryCode.updateMany({
          where: { id: candidate.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        if (result.count !== 1) {
          throw new Error('ALREADY_USED');
        }
        if (needsRehash) {
          const newHash = await argon2Hash(normalized, ARGON_OPTIONS);
          await tx.recoveryCode.update({
            where: { id: candidate.id },
            data: { codeHash: newHash },
          });
        }
      });
      return true;
    } catch (e) {
      if (e instanceof Error && e.message === 'ALREADY_USED') {
        // Course concurrente : le code a été consommé par un autre process
        return false;
      }
      throw e;
    }
  }

  return false;
}

export async function countUnusedRecoveryCodes(userId: string): Promise<number> {
  return prisma.recoveryCode.count({ where: { userId, usedAt: null } });
}
