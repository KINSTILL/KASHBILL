import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { clearDatabase } from '../../helpers/db';
import { createTestUser, resetUserCounter } from '../../helpers/factories';
import {
  generateRecoveryCodes,
  createRecoveryCodes,
  verifyAndConsumeRecoveryCode,
  countUnusedRecoveryCodes,
} from '@/lib/auth/recovery';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

describe('generateRecoveryCodes', () => {
  it('génère 8 codes uniques au format XXXX-XXXX', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    for (const c of codes) {
      expect(c).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    }
    expect(new Set(codes).size).toBe(8);
  });

  it('génère des codes différents à chaque appel', () => {
    const a = generateRecoveryCodes();
    const b = generateRecoveryCodes();
    expect(a).not.toEqual(b);
  });
});

describe('createRecoveryCodes', () => {
  it('stocke 8 codes hashés en base', async () => {
    const user = await createTestUser();
    const codes = await createRecoveryCodes(user.id);
    expect(codes).toHaveLength(8);
    const count = await prisma.recoveryCode.count({ where: { userId: user.id } });
    expect(count).toBe(8);
  });

  it('ne stocke jamais les codes en clair', async () => {
    const user = await createTestUser();
    const codes = await createRecoveryCodes(user.id);
    const stored = await prisma.recoveryCode.findMany({ where: { userId: user.id } });
    for (const s of stored) {
      expect(codes).not.toContain(s.codeHash);
      expect(s.codeHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});

describe('verifyAndConsumeRecoveryCode', () => {
  it('accepte un code valide et le marque comme utilisé', async () => {
    const user = await createTestUser();
    const codes = await createRecoveryCodes(user.id);
    const result = await verifyAndConsumeRecoveryCode(user.id, codes[0]!);
    expect(result).toBe(true);
    expect(await countUnusedRecoveryCodes(user.id)).toBe(7);
  });

  it('accepte le code sans tiret (normalisation)', async () => {
    const user = await createTestUser();
    const codes = await createRecoveryCodes(user.id);
    const withDash = codes[0]!;
    const withoutDash = withDash.replace(/-/g, '');
    expect(await verifyAndConsumeRecoveryCode(user.id, withoutDash)).toBe(true);
  });

  it('rejette un code invalide', async () => {
    const user = await createTestUser();
    await createRecoveryCodes(user.id);
    expect(await verifyAndConsumeRecoveryCode(user.id, 'AAAA-BBBB')).toBe(false);
  });

  it('empêche la double consommation', async () => {
    const user = await createTestUser();
    const codes = await createRecoveryCodes(user.id);
    await verifyAndConsumeRecoveryCode(user.id, codes[0]!);
    expect(await verifyAndConsumeRecoveryCode(user.id, codes[0]!)).toBe(false);
  });

  it('rejette un code d\'un autre utilisateur', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const codes1 = await createRecoveryCodes(user1.id);
    expect(await verifyAndConsumeRecoveryCode(user2.id, codes1[0]!)).toBe(false);
  });
});

