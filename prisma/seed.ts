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
// Internal note: mobile money coverage active in 7 countries.
// Keep provider-agnostic naming in code and UI.
const MOBILE_MONEY_ENABLED = new Set(['CM', 'CI', 'SN', 'GA', 'GH', 'KE', 'UG']);

const COUNTRIES = [
  { countryCode: 'CM', countryNameFr: 'Cameroun', countryNameEn: 'Cameroon', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 19.25, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'CI', countryNameFr: "Côte d'Ivoire", countryNameEn: 'Ivory Coast', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'SN', countryNameFr: 'Sénégal', countryNameEn: 'Senegal', currency: 'XOF', taxIdLabel: 'NINEA', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'GA', countryNameFr: 'Gabon', countryNameEn: 'Gabon', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm'] },
  { countryCode: 'GH', countryNameFr: 'Ghana', countryNameEn: 'Ghana', currency: 'GHS', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'] },
  { countryCode: 'KE', countryNameFr: 'Kenya', countryNameEn: 'Kenya', currency: 'KES', taxIdLabel: 'KRA PIN', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'] },
  { countryCode: 'UG', countryNameFr: 'Ouganda', countryNameEn: 'Uganda', currency: 'UGX', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'] },
  // Autres pays (app utilisable, pas de mobile money sur documents)
  { countryCode: 'BJ', countryNameFr: 'Bénin', countryNameEn: 'Benin', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'BF', countryNameFr: 'Burkina Faso', countryNameEn: 'Burkina Faso', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'TG', countryNameFr: 'Togo', countryNameEn: 'Togo', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'ML', countryNameFr: 'Mali', countryNameEn: 'Mali', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'NE', countryNameFr: 'Niger', countryNameEn: 'Niger', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 19.00, requiredFields: ['taxId','rccm','legalAddress'] },
  { countryCode: 'NG', countryNameFr: 'Nigéria', countryNameEn: 'Nigeria', currency: 'NGN', taxIdLabel: 'TIN', rccmLabel: 'RC No.', vatRate: 7.50, requiredFields: ['taxId'] },
  { countryCode: 'SL', countryNameFr: 'Sierra Leone', countryNameEn: 'Sierra Leone', currency: 'SLE', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'] },
  { countryCode: 'CG', countryNameFr: 'Congo', countryNameEn: 'Congo', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm'] },
  { countryCode: 'CD', countryNameFr: 'RDC', countryNameEn: 'DRC', currency: 'CDF', taxIdLabel: 'ID Nat.', rccmLabel: 'RCCM', vatRate: 16.00, requiredFields: ['taxId'] },
  { countryCode: 'TZ', countryNameFr: 'Tanzanie', countryNameEn: 'Tanzania', currency: 'TZS', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'] },
  { countryCode: 'RW', countryNameFr: 'Rwanda', countryNameEn: 'Rwanda', currency: 'RWF', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'] },
  { countryCode: 'ZM', countryNameFr: 'Zambie', countryNameEn: 'Zambia', currency: 'ZMW', taxIdLabel: 'TPIN', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'] },
  { countryCode: 'MW', countryNameFr: 'Malawi', countryNameEn: 'Malawi', currency: 'MWK', taxIdLabel: 'TPIN', rccmLabel: 'Reg. No.', vatRate: 16.50, requiredFields: ['taxId'] },
  { countryCode: 'MZ', countryNameFr: 'Mozambique', countryNameEn: 'Mozambique', currency: 'MZN', taxIdLabel: 'NUIT', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'] },
  { countryCode: 'LS', countryNameFr: 'Lesotho', countryNameEn: 'Lesotho', currency: 'LSL', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'] },
];

async function seedCountries() {
  for (const country of COUNTRIES) {
    await prisma.countryTaxConfig.upsert({
      where: { countryCode: country.countryCode },
      update: {
        ...country,
        vatRate: country.vatRate,
        requiredFields: country.requiredFields,
        legalMentionsTemplate: (country as { legalMentionsTemplate?: string }).legalMentionsTemplate ?? '',
        mobileMoneyEnabled: MOBILE_MONEY_ENABLED.has(country.countryCode),
      },
      create: {
        ...country,
        vatRate: country.vatRate,
        requiredFields: country.requiredFields,
        legalMentionsTemplate: (country as { legalMentionsTemplate?: string }).legalMentionsTemplate ?? '',
        mobileMoneyEnabled: MOBILE_MONEY_ENABLED.has(country.countryCode),
      },
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
