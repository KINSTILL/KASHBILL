import { prisma } from '@/lib/db';
import { hash } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';
import type { Role, User } from '@prisma/client';

let userCounter = 0;

const REFERRAL_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function genReferralCode(): string {
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += REFERRAL_ALPHABET[bytes[i]! % REFERRAL_ALPHABET.length];
  }
  return code;
}

export type CreateTestUserOptions = {
  phone?: string;
  role?: Role;
  proUntil?: Date | null;
  name?: string;
  taxId?: string | null;
  rccm?: string | null;
};

export async function createTestUser(
  overrides: CreateTestUserOptions = {}
): Promise<User> {
  userCounter++;
  const phone = overrides.phone ?? `+237699${String(userCounter).padStart(6, '0')}`;

  const pinHash = await hash('123456', {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    algorithm: 2,
  });

  return prisma.user.create({
    data: {
      phone,
      pinHash,
      role: overrides.role ?? 'USER',
      proUntil: overrides.proUntil ?? null,
      name: overrides.name ?? `Test User ${userCounter}`,
      taxId: overrides.taxId ?? null,
      rccm: overrides.rccm ?? null,
      referralCode: genReferralCode(),
    },
  });
}

export function resetUserCounter(): void {
  userCounter = 0;
}

