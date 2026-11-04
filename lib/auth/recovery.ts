import { createHash, randomInt } from 'node:crypto';
import { prisma } from '@/lib/db';
import { RECOVERY_ALPHABET, RECOVERY_CODE_LENGTH, RECOVERY_CODES_COUNT } from '@/lib/constants';

function generateOneCode(): string {
  let chars = '';
  for (let i = 0; i < RECOVERY_CODE_LENGTH; i++) {
    chars += RECOVERY_ALPHABET[randomInt(0, RECOVERY_ALPHABET.length)];
  }
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

function normalizeCode(code: string): string {
  return code.replace(/-/g, '').toUpperCase();
}

function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(normalizeCode(code)).digest('hex');
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
  await prisma.recoveryCode.createMany({
    data: codes.map((code) => ({ userId, codeHash: hashRecoveryCode(code) })),
  });
  return codes;
}

export async function verifyAndConsumeRecoveryCode(
  userId: string,
  code: string
): Promise<boolean> {
  const codeHash = hashRecoveryCode(code);
  const result = await prisma.recoveryCode.updateMany({
    where: { userId, codeHash, usedAt: null },
    data: { usedAt: new Date() },
  });
  return result.count === 1;
}

export async function countUnusedRecoveryCodes(userId: string): Promise<number> {
  return prisma.recoveryCode.count({ where: { userId, usedAt: null } });
}

