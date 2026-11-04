/* eslint-disable no-console */
import { PrismaClient, Role } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { randomInt } from 'node:crypto';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Générateur de referralCode
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Seed admin
// ─────────────────────────────────────────────
async function seedAdmin() {
  const adminPhone = process.env.ADMIN_PHONE;
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPhone || !adminPin) {
    throw new Error('ADMIN_PHONE et ADMIN_PIN doivent être définis dans .env.local');
  }

  const pinHash = await hash(adminPin, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    algorithm: 2,
  });

  const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });

  if (existing) {
    await prisma.user.update({
      where: { phone: adminPhone },
      data: { pinHash, role: Role.ADMIN },
    });
    console.log(`✅ Admin mis à jour : ${adminPhone}`);
  } else {
    const referralCode = await generateUniqueReferralCode();
    await prisma.user.create({
      data: {
        phone: adminPhone,
        pinHash,
        role: Role.ADMIN,
        name: 'Admin',
        referralCode,
      },
    });
    console.log(`✅ Admin créé : ${adminPhone} (referralCode: ${referralCode})`);
  }
}

// ─────────────────────────────────────────────
// Seed pays
// ─────────────────────────────────────────────
const COUNTRIES = [
  {
    countryCode: 'CM', countryNameFr: 'Cameroun', countryNameEn: 'Cameroon',
    currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 19.25,
    requiredFields: ['taxId', 'rccm', 'legalAddress'],
    legalMentionsTemplate: 'NIU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%',
  },
  {
    countryCode: 'SN', countryNameFr: 'Sénégal', countryNameEn: 'Senegal',
    currency: 'XOF', taxIdLabel: 'NINEA', rccmLabel: 'RCCM', vatRate: 18.00,
    requiredFields: ['taxId', 'rccm', 'legalAddress'],
    legalMentionsTemplate: 'NINEA : {taxId} — RCCM : {rccm} — TVA : {vatRate}%',
  },
  {
    countryCode: 'CI', countryNameFr: "Côte d'Ivoire", countryNameEn: 'Ivory Coast',
    currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00,
    requiredFields: ['taxId', 'rccm', 'legalAddress'],
    legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%',
  },
  {
    countryCode: 'BJ', countryNameFr: 'Bénin', countryNameEn: 'Benin',
    currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00,
    requiredFields: ['taxId', 'rccm', 'legalAddress'],
    legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%',
  },
  {
    countryCode: 'TG', countryNameFr: 'Togo', countryNameEn: 'Togo',
    currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00,
    requiredFields: ['taxId', 'rccm', 'legalAddress'],
    legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%',
  },
  {
    countryCode: 'BF', countryNameFr: 'Burkina Faso', countryNameEn: 'Burkina Faso',
    currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00,
    requiredFields: ['taxId', 'rccm', 'legalAddress'],
    legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%',
  },
  {
    countryCode: 'ML', countryNameFr: 'Mali', countryNameEn: 'Mali',
    currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00,
    requiredFields: ['taxId', 'rccm', 'legalAddress'],
    legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%',
  },
  {
    countryCode: 'NE', countryNameFr: 'Niger', countryNameEn: 'Niger',
    currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 19.00,
    requiredFields: ['taxId', 'rccm', 'legalAddress'],
    legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%',
  },
];

async function seedCountries() {
  for (const country of COUNTRIES) {
    await prisma.countryTaxConfig.upsert({
      where: { countryCode: country.countryCode },
      update: country,
      create: country,
    });
  }
  console.log(`✅ ${COUNTRIES.length} pays seedés`);
}

// ─────────────────────────────────────────────
// Seed seuils de fraude
// ─────────────────────────────────────────────
const THRESHOLDS = [
  { key: 'MAX_DOCS_PER_24H',                value: 300,      floor: 10,      ceiling: 3000,      description: 'Nombre max de documents par utilisateur / 24h' },
  { key: 'MAX_AMOUNT_FCFA',                 value: 5000000,  floor: 500000,  ceiling: 100000000, description: 'Montant max d\'un document sans flag' },
  { key: 'HIGH_AMOUNT_THRESHOLD_FCFA',      value: 2000000,  floor: 200000,  ceiling: 20000000,  description: 'Seuil "montant élevé" pour compte récent' },
  { key: 'NEW_ACCOUNT_DAYS',                value: 7,        floor: 0,       ceiling: 30,        description: 'Ancienneté minimale pour générer gros montant' },
  { key: 'FRAUD_FIELDS_THRESHOLD_FCFA',     value: 1000000,  floor: 200000,  ceiling: 20000000,  description: 'Seuil au-delà duquel les champs fiscaux sont recommandés' },
  { key: 'MAX_DOCS_PER_CLIENT_24H',         value: 50,       floor: 10,      ceiling: 200,       description: 'Nombre max de documents pour un même client / 24h' },
];

async function seedThresholds() {
  for (const t of THRESHOLDS) {
    await prisma.fraudThreshold.upsert({
      where: { key: t.key },
      update: { floor: t.floor, ceiling: t.ceiling, description: t.description },
      create: t,
    });
  }
  console.log(`✅ ${THRESHOLDS.length} seuils de fraude seedés`);
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
  await seedAdmin();
  await seedCountries();
  await seedThresholds();
}

main()
  .catch((e) => {
    console.error('❌ Seed échoué :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
