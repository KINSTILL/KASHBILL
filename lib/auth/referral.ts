import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/db';
import {
  REFERRAL_ALPHABET,
  REFERRAL_CODE_LENGTH,
} from '@/lib/constants';

export function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_ALPHABET[randomInt(0, REFERRAL_ALPHABET.length)];
  }
  return code;
}

export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) return code;
  }
  throw new Error('Impossible de générer un referralCode unique après 10 tentatives');
}

export async function findUserByReferralCode(code: string) {
  return prisma.user.findUnique({ where: { referralCode: code } });
}

