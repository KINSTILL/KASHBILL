import { prisma, confirm, audit, fail, ok } from './_helpers';

async function main() {
  const [type, value, reason] = process.argv.slice(2);
  if (!type || !value || !reason) fail('Usage: remove-blacklist.ts <PHONE|TAX_ID|DOCUMENT_HASH> <value> "<justification>"');
  if (!['PHONE', 'TAX_ID', 'DOCUMENT_HASH'].includes(type)) fail('Type invalide');

  const entry = await prisma.blacklistEntry.findUnique({
    where: { type_value: { type, value } },
  });
  if (!entry) fail('Entrée introuvable');

  console.log(`Supprimer blacklist [${type}] "${value}" — raison: ${reason}`);
  if (!(await confirm('Confirmer'))) fail('Annulé');

  await prisma.blacklistEntry.delete({ where: { id: entry.id } });
  await audit('cli_blacklist_removed', { type, value, reason, previousReason: entry.reason });
  ok(`Blacklist [${type}] "${value}" supprimée`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

