import { prisma, confirm, audit, fail, ok } from './_helpers';

async function main() {
  const [key, valueStr, reason] = process.argv.slice(2);
  if (!key || !valueStr || !reason) fail('Usage: modify-threshold.ts <KEY> <value> "<justification>"');
  const value = parseInt(valueStr, 10);
  if (!Number.isFinite(value) || value < 0) fail('Valeur invalide');

  const t = await prisma.fraudThreshold.findUnique({ where: { key } });
  if (!t) fail(`Seuil inconnu: ${key}`);

  console.log(`Seuil ${key}: ${t.value} → ${value} (bornes UI [${t.floor}, ${t.ceiling}])`);
  console.log(`Raison: ${reason}`);
  console.log(`⚠️  Modification hors bornes UI. Accès SSH requis.`);
  if (!(await confirm('Confirmer'))) fail('Annulé');

  await prisma.fraudThreshold.update({ where: { key }, data: { value } });
  await audit('cli_threshold_modified', { key, oldValue: t.value, newValue: value, reason });
  ok(`Seuil ${key} = ${value}`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

