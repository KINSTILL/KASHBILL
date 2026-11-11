/**
 * Supprime tous les comptes qui ne sont pas ADMIN, ainsi que leurs documents.
 * Usage :
 *   dry-run : pnpm exec dotenv -e .env.local -- pnpm exec tsx scratch/reset-non-admin-users.ts
 *   exécuter: pnpm exec dotenv -e .env.local -- pnpm exec tsx scratch/reset-non-admin-users.ts --execute
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const execute = process.argv.includes('--execute');

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, phone: true },
  });
  if (admins.length === 0) throw new Error('Aucun compte ADMIN : abandon pour ne rien perdre.');
  const adminIds = admins.map((a) => a.id);

  const usersToDelete = await prisma.user.count({ where: { id: { notIn: adminIds } } });
  const docsToDelete = await prisma.document.count({ where: { userId: { notIn: adminIds } } });
  const blacklistByOthers = await prisma.blacklistEntry.count({
    where: { createdById: { notIn: adminIds } },
  });

  console.log(`Admins conservés : ${admins.length} (${admins.map((a) => a.phone).join(', ')})`);
  console.log(`Comptes à supprimer : ${usersToDelete}`);
  console.log(`Documents à supprimer : ${docsToDelete}`);
  console.log(`Blacklist créée par des non-admins (réattribuée à l'admin) : ${blacklistByOthers}`);

  if (!execute) {
    console.log('\nDry-run : rien n\'a été modifié. Relancer avec --execute pour appliquer.');
    return;
  }

  const adminId = adminIds[0]!;
  await prisma.$transaction(async (tx) => {
    // BlacklistEntry.createdById est en onDelete Restrict : on réattribue à l'admin
    await tx.blacklistEntry.updateMany({
      where: { createdById: { notIn: adminIds } },
      data: { createdById: adminId },
    });
    const docs = await tx.document.deleteMany({ where: { userId: { notIn: adminIds } } });
    const users = await tx.user.deleteMany({ where: { id: { notIn: adminIds } } });
    console.log(`Supprimé : ${docs.count} documents, ${users.count} comptes.`);
  });

  const remaining = await prisma.user.findMany({ select: { role: true, phone: true } });
  console.log('Comptes restants :', remaining);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
