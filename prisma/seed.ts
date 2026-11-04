import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { randomInt } from 'node:crypto';

const prisma = new PrismaClient();

// Alphabet sans caractères ambigus (0, O, 1, I, L exclus)
// La version canonique sera dans lib/auth/referral.ts (étape 4)
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;

function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new Error('Impossible de générer un referralCode unique après 10 tentatives');
}

async function main() {
  const adminPhone = process.env.ADMIN_PHONE;
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPhone || !adminPin) {
    throw new Error('ADMIN_PHONE et ADMIN_PIN doivent être définis dans .env.local');
  }

  // Paramètres argon2id identiques à ceux qui seront utilisés à l'étape 4
  const pinHash = await hash(adminPin, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    algorithm: 2, // 2 = Argon2id
  });

  const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });

  if (existing) {
    await prisma.user.update({
      where: { phone: adminPhone },
      data: { pinHash, role: 'ADMIN' },
    });
    console.log(`✅ Admin mis à jour : ${adminPhone}`);
  } else {
    const referralCode = await generateUniqueReferralCode();
    await prisma.user.create({
      data: {
        phone: adminPhone,
        pinHash,
        role: 'ADMIN',
        name: 'Admin',
        referralCode,
      },
    });
    console.log(`✅ Admin créé : ${adminPhone} (referralCode: ${referralCode})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

