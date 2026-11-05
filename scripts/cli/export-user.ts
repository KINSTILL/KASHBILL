import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma, confirm, audit, fail, ok } from './_helpers';

async function main() {
  const [identifier, reason] = process.argv.slice(2);
  if (!identifier || !reason) fail('Usage: export-user.ts <phone|userId> "<justification>"');

  const user = await prisma.user.findFirst({
    where: { OR: [{ id: identifier }, { phone: identifier }] },
  });
  if (!user) fail('Utilisateur introuvable');

  console.log(`Export utilisateur ${user.phone} — raison: ${reason}`);
  if (!(await confirm('Confirmer'))) fail('Annulé');

  const [clients, documents, subscriptions, referralsMade, referralReceived, auditLogs] = await Promise.all([
    prisma.client.findMany({ where: { userId: user.id } }),
    prisma.document.findMany({ where: { userId: user.id } }),
    prisma.subscription.findMany({ where: { userId: user.id } }),
    prisma.referral.findMany({ where: { parrainId: user.id } }),
    prisma.referral.findUnique({ where: { filleulId: user.id } }),
    prisma.auditLog.findMany({ where: { OR: [{ userId: user.id }, { actorId: user.id }, { targetId: user.id }] } }),
  ]);

  // Ne JAMAIS exporter pinHash ni codes hashés
  const { pinHash: _p, ...safeUser } = user;

  const dump = {
    exportedAt: new Date().toISOString(),
    reason,
    user: safeUser,
    clients,
    documents,
    subscriptions,
    referralsMade,
    referralReceived,
    auditLogs,
  };

  const filename = `export_${user.phone.replace('+', '')}_${Date.now()}.json`;
  const outPath = path.join('/tmp', filename);
  await writeFile(outPath, JSON.stringify(dump, null, 2), 'utf8');

  await audit('cli_user_exported', { userId: user.id, reason, file: outPath });
  ok(`Export écrit: ${outPath} (${JSON.stringify(dump).length} octets)`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

