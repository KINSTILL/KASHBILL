import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/db';
import {
  DEVICE_APPROVAL_CODE_LENGTH,
  DEVICE_APPROVAL_TTL_MINUTES,
} from '@/lib/constants';

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function createApproval(
  userId: string,
  newDeviceId: string,
  userAgent: string | null,
  ip: string | null
): Promise<{ approvalId: string; code: string }> {
  // Nettoyage des approbations expirées ou consommées
  await prisma.deviceApproval.deleteMany({
    where: {
      userId,
      OR: [{ consumed: true }, { expiresAt: { lt: new Date() } }],
    },
  });

  const code = randomInt(0, 1_000_000)
    .toString()
    .padStart(DEVICE_APPROVAL_CODE_LENGTH, '0');
  const expiresAt = new Date(Date.now() + DEVICE_APPROVAL_TTL_MINUTES * 60_000);

  const approval = await prisma.deviceApproval.create({
    data: {
      userId,
      codeHash: hashCode(code),
      expiresAt,
      newDeviceId,
      userAgent,
      ip,
    },
  });

  return { approvalId: approval.id, code };
}

export type PendingApproval = {
  id: string;
  newDeviceId: string;
  userAgent: string | null;
  createdAt: Date;
};

export async function listPendingApprovals(userId: string): Promise<PendingApproval[]> {
  const approvals = await prisma.deviceApproval.findMany({
    where: { userId, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, newDeviceId: true, userAgent: true, createdAt: true },
  });
  return approvals;
}

export type ApproveResult =
  | { ok: true; newDeviceId: string }
  | { ok: false; reason: 'EXPIRED' | 'INVALID' | 'NOT_FOUND' | 'ATTEMPTS_EXCEEDED' };

export async function approveDevice(
  userId: string,
  approvalId: string,
  code: string
): Promise<ApproveResult> {
  const approval = await prisma.deviceApproval.findUnique({ where: { id: approvalId } });
  if (!approval || approval.userId !== userId) {
    return { ok: false, reason: 'NOT_FOUND' };
  }
  if (approval.consumed) return { ok: false, reason: 'NOT_FOUND' };
  if (approval.expiresAt < new Date()) return { ok: false, reason: 'EXPIRED' };

  const providedHash = hashCode(code);
  if (!safeCompare(providedHash, approval.codeHash)) {
    // Incrémenter les tentatives (pas stocké séparément, mais on peut
    // consommer l'approbation après N tentatives ratées)
    await prisma.deviceApproval.update({
      where: { id: approval.id },
      data: { consumed: true },
    });
    return { ok: false, reason: 'INVALID' };
  }

  await prisma.deviceApproval.update({
    where: { id: approval.id },
    data: { consumed: true },
  });

  return { ok: true, newDeviceId: approval.newDeviceId };
}
