import { hash } from '@node-rs/argon2';
import { randomInt } from 'node:crypto';
import { prisma, confirm, audit, fail, ok } from './_helpers';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function genCode(): string {
  let c = '';
  for (let i = 0; i < 8; i++) c += ALPHABET[randomInt(0, ALPHABET.length)];
  return c;
}

async function main() {
  const [phone, pin, name] = process.argv.slice(2);

  if (!phone?.match(/^\+2376\d{8}$/)) fail('Usage: create-admin.ts <+237XXXXXXXXX> <PIN6> "<Nom>"');
  if (!pin?.match(/^\d{6}$/)) fail('PIN doit être 6 chiffres');

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) fail(`Utilisateur déjà existant: ${phone} (role=${existing.role})`);

  console.log(`Créer ADMIN:\n  phone: ${phone}\n  name:  ${name ?? 'Admin'}\n`);
  if (!(await confirm('Confirmer'))) fail('Annulé');

  const pinHash = await hash(pin, { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 });
  let referralCode = genCode();
  while (await prisma.user.findUnique({ where: { referralCode } })) referralCode = genCode();

  const user = await prisma.user.create({
    data: { phone, pinHash, name: name ?? 'Admin', role: 'ADMIN', referralCode },
  });

  await audit('cli_admin_created', { userId: user.id, phone });
  ok(`ADMIN créé: ${user.id} (${phone})`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

