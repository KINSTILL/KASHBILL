import { describe, it, expect, beforeEach } from 'vitest';
import { clearDatabase } from '../../helpers/db';
import { createTestUser, resetUserCounter } from '../../helpers/factories';
import {
  generateReferralCode,
  generateUniqueReferralCode,
  findUserByReferralCode,
} from '@/lib/auth/referral';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

describe('generateReferralCode', () => {
  it('génère 8 caractères sans ambiguïté', () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[2-9A-HJKMNP-Z]{8}$/);
  });

  it('génère des codes différents à chaque appel', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) codes.add(generateReferralCode());
    expect(codes.size).toBe(1000);
  });

  it('n\'utilise jamais 0, O, 1, I, L', () => {
    for (let i = 0; i < 500; i++) {
      const code = generateReferralCode();
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });
});

describe('generateUniqueReferralCode', () => {
  it('génère un code unique en base', async () => {
    const code = await generateUniqueReferralCode();
    expect(code).toHaveLength(8);
    expect(await findUserByReferralCode(code)).toBeNull();
  });
});

describe('findUserByReferralCode', () => {
  it('retourne l\'utilisateur si trouvé', async () => {
    const user = await createTestUser();
    const found = await findUserByReferralCode(user.referralCode);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(user.id);
  });

  it('retourne null si absent', async () => {
    expect(await findUserByReferralCode('ZZZZZZZZ')).toBeNull();
  });
});

