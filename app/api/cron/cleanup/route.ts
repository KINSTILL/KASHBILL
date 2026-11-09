import type { NextRequest } from 'next/server';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/db';
import { jsonOk, jsonError, handleApiError } from '@/lib/api-helpers';
import { env } from '@/lib/env';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    if (req.headers.get('x-cron-secret') !== env.CRON_SECRET) {
      return jsonError('UNAUTHORIZED', 'Invalid cron secret', 401);
    }

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 86_400_000);

    const results = {
      deviceIpPurged: 0,
      approvalsPurged: 0,
      recoveryCodesPurged: 0,
      auditLogsPurged: 0,
      documentsPurged: 0,
      pdfFilesPurged: 0,
    };

    // 1. Purge lastIp des devices > 90 jours
    const deviceIpResult = await prisma.device.updateMany({
      where: {
        lastIp: { not: null },
        lastSeenAt: { lt: ninetyDaysAgo },
      },
      data: { lastIp: null },
    });
    results.deviceIpPurged = deviceIpResult.count;

    // 2. Purge DeviceApproval expirées ou consommées > 7 jours
    const approvalsResult = await prisma.deviceApproval.deleteMany({
      where: {
        OR: [
          { consumed: true, createdAt: { lt: sevenDaysAgo } },
          { expiresAt: { lt: sevenDaysAgo } },
        ],
      },
    });
    results.approvalsPurged = approvalsResult.count;

    // 3. Purge RecoveryCode utilisés > 30 jours
    const recoveryResult = await prisma.recoveryCode.deleteMany({
      where: {
        usedAt: { not: null, lt: thirtyDaysAgo },
      },
    });
    results.recoveryCodesPurged = recoveryResult.count;

    // 4. Purge AuditLog > 12 mois
    const auditResult = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: twelveMonthsAgo } },
    });
    results.auditLogsPurged = auditResult.count;

    // 5. Purge Document expirés (retainUntil < now) + fichiers PDF associés
    const expiredDocs = await prisma.document.findMany({
      where: { retainUntil: { lt: now } },
      select: { id: true, pdfPath: true },
      take: 500,
    });

    for (const doc of expiredDocs) {
      if (doc.pdfPath) {
        try {
          await unlink(path.join(process.cwd(), doc.pdfPath));
          results.pdfFilesPurged++;
        } catch {
          // Fichier déjà absent, continuer
        }
      }
    }

    if (expiredDocs.length > 0) {
      const ids = expiredDocs.map((d) => d.id);
      const delResult = await prisma.document.deleteMany({ where: { id: { in: ids } } });
      results.documentsPurged = delResult.count;
    }

    return jsonOk({ ok: true, timestamp: now.toISOString(), results });
  } catch (err) {
    return handleApiError(err);
  }
}
