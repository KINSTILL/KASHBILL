import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { clearDatabase } from '../../helpers/db';
import { createTestUser, resetUserCounter } from '../../helpers/factories';
import {
  createApproval,
  listPendingApprovals,
  approveDevice,
} from '@/lib/auth/device-approval';

beforeEach(async () => {
  await clearDatabase();
  resetUserCounter();
});

describe('createApproval', () => {
  it('crée une approbation avec un code à 6 chiffres', async () => {
    const user = await createTestUser();
    const { approvalId, code } = await createApproval(
      user.id,
      'new-device-1',
      'Mozilla/5.0',
      '1.1.1.1'
    );
    expect(approvalId).toBeDefined();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('stocke le hash du code, pas le code en clair', async () => {
    const user = await createTestUser();
    const { approvalId, code } = await createApproval(user.id, 'dev', 'UA', '1.1.1.1');
    const stored = await prisma.deviceApproval.findUnique({ where: { id: approvalId } });
    expect(stored!.codeHash).not.toBe(code);
    expect(stored!.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('nettoie les approbations consommées avant d\'en créer une nouvelle', async () => {
    const user = await createTestUser();
    const { approvalId } = await createApproval(user.id, 'dev1', 'UA', '1.1.1.1');
    await prisma.deviceApproval.update({
      where: { id: approvalId },
      data: { consumed: true },
    });
    await createApproval(user.id, 'dev2', 'UA', '1.1.1.2');
    const count = await prisma.deviceApproval.count({ where: { userId: user.id } });
    expect(count).toBe(1);
  });
});

describe('listPendingApprovals', () => {
  it('liste les approbations non consommées et non expirées', async () => {
    const user = await createTestUser();
    await createApproval(user.id, 'dev1', 'UA', '1.1.1.1');
    const pending = await listPendingApprovals(user.id);
    expect(pending).toHaveLength(1);
    expect(pending[0]!.newDeviceId).toBe('dev1');
  });

  it('ne retourne jamais le code (même hashé)', async () => {
    const user = await createTestUser();
    await createApproval(user.id, 'dev1', 'UA', '1.1.1.1');
    const pending = await listPendingApprovals(user.id);
    expect(pending[0]).not.toHaveProperty('codeHash');
    expect(pending[0]).not.toHaveProperty('code');
  });
});

describe('approveDevice', () => {
  it('accepte le bon code', async () => {
    const user = await createTestUser();
    const { approvalId, code } = await createApproval(user.id, 'new-dev', 'UA', '1.1.1.1');
    const result = await approveDevice(user.id, approvalId, code);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.newDeviceId).toBe('new-dev');
  });

  it('rejette un mauvais code et consomme l\'approbation', async () => {
    const user = await createTestUser();
    const { approvalId } = await createApproval(user.id, 'new-dev', 'UA', '1.1.1.1');
    const result = await approveDevice(user.id, approvalId, '000000');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('INVALID');
    // L'approbation est consommée
    const stored = await prisma.deviceApproval.findUnique({ where: { id: approvalId } });
    expect(stored!.consumed).toBe(true);
  });

  it('rejette une approbation expirée', async () => {
    const user = await createTestUser();
    const { approvalId, code } = await createApproval(user.id, 'dev', 'UA', '1.1.1.1');
    await prisma.deviceApproval.update({
      where: { id: approvalId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const result = await approveDevice(user.id, approvalId, code);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('EXPIRED');
  });

  it('rejette une approbation d\'un autre utilisateur', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const { approvalId, code } = await createApproval(user1.id, 'dev', 'UA', '1.1.1.1');
    const result = await approveDevice(user2.id, approvalId, code);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('NOT_FOUND');
  });

  it('empêche la double consommation', async () => {
    const user = await createTestUser();
    const { approvalId, code } = await createApproval(user.id, 'dev', 'UA', '1.1.1.1');
    await approveDevice(user.id, approvalId, code);
    const second = await approveDevice(user.id, approvalId, code);
    expect(second.ok).toBe(false);
  });
});

