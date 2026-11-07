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
  // 19 pays pawaPay
  { countryCode: 'BJ', countryNameFr: 'Bénin', countryNameEn: 'Benin', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'], legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MTN_BJ', name: 'MTN MoMo' }, { code: 'MOOV_BJ', name: 'Moov Africa' }] },
  { countryCode: 'BF', countryNameFr: 'Burkina Faso', countryNameEn: 'Burkina Faso', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'], legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'ORANGE_BF', name: 'Orange Money' }, { code: 'MOOV_BF', name: 'Moov Africa' }] },
  { countryCode: 'CI', countryNameFr: "Côte d'Ivoire", countryNameEn: 'Ivory Coast', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'], legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'ORANGE_CI', name: 'Orange Money' }, { code: 'MTN_CI', name: 'MTN MoMo' }, { code: 'MOOV_CI', name: 'Moov Africa' }, { code: 'WAVE_CI', name: 'Wave' }] },
  { countryCode: 'GH', countryNameFr: 'Ghana', countryNameEn: 'Ghana', currency: 'GHS', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'], legalMentionsTemplate: 'TIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MTN_GH', name: 'MTN MoMo' }, { code: 'VODAFONE_GH', name: 'Telecel Cash' }, { code: 'AIRTELTIGO_GH', name: 'AT Money' }] },
  { countryCode: 'NG', countryNameFr: 'Nigéria', countryNameEn: 'Nigeria', currency: 'NGN', taxIdLabel: 'TIN', rccmLabel: 'RC No.', vatRate: 7.50, requiredFields: ['taxId'], legalMentionsTemplate: 'TIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MTN_NG', name: 'MTN MoMo PSB' }, { code: 'AIRTEL_NG', name: 'Airtel SmartCash' }, { code: 'NIBSS_NG', name: 'NIBSS Transfer' }] },
  { countryCode: 'SN', countryNameFr: 'Sénégal', countryNameEn: 'Senegal', currency: 'XOF', taxIdLabel: 'NINEA', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'], legalMentionsTemplate: 'NINEA : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'ORANGE_SN', name: 'Orange Money' }, { code: 'WAVE_SN', name: 'Wave' }, { code: 'FREE_SN', name: 'Free Money' }] },
  { countryCode: 'SL', countryNameFr: 'Sierra Leone', countryNameEn: 'Sierra Leone', currency: 'SLE', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'], legalMentionsTemplate: 'TIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'ORANGE_SL', name: 'Orange Money' }, { code: 'AFRICELL_SL', name: 'Africell Money' }] },
  { countryCode: 'CM', countryNameFr: 'Cameroun', countryNameEn: 'Cameroon', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 19.25, requiredFields: ['taxId','rccm','legalAddress'], legalMentionsTemplate: 'NIU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MTN_CM', name: 'MTN MoMo' }, { code: 'ORANGE_CM', name: 'Orange Money' }] },
  { countryCode: 'CG', countryNameFr: 'Congo', countryNameEn: 'Congo', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm'], legalMentionsTemplate: 'NIU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MTN_CG', name: 'MTN MoMo' }, { code: 'AIRTEL_CG', name: 'Airtel Money' }] },
  { countryCode: 'GA', countryNameFr: 'Gabon', countryNameEn: 'Gabon', currency: 'XAF', taxIdLabel: 'NIU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm'], legalMentionsTemplate: 'NIU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'AIRTEL_GA', name: 'Airtel Money' }, { code: 'MOOV_GA', name: 'Moov Africa' }] },
  { countryCode: 'CD', countryNameFr: 'RDC', countryNameEn: 'DRC', currency: 'CDF', taxIdLabel: 'ID Nat.', rccmLabel: 'RCCM', vatRate: 16.00, requiredFields: ['taxId'], legalMentionsTemplate: 'ID Nat. : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MPESA_CD', name: 'Vodacom M-Pesa' }, { code: 'ORANGE_CD', name: 'Orange Money' }, { code: 'AIRTEL_CD', name: 'Airtel Money' }] },
  { countryCode: 'KE', countryNameFr: 'Kenya', countryNameEn: 'Kenya', currency: 'KES', taxIdLabel: 'KRA PIN', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'], legalMentionsTemplate: 'KRA PIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MPESA_KE', name: 'Safaricom M-Pesa' }, { code: 'AIRTEL_KE', name: 'Airtel Money' }] },
  { countryCode: 'UG', countryNameFr: 'Ouganda', countryNameEn: 'Uganda', currency: 'UGX', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'], legalMentionsTemplate: 'TIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MTN_UG', name: 'MTN Mobile Money' }, { code: 'AIRTEL_UG', name: 'Airtel Money' }] },
  { countryCode: 'TZ', countryNameFr: 'Tanzanie', countryNameEn: 'Tanzania', currency: 'TZS', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'], legalMentionsTemplate: 'TIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MPESA_TZ', name: 'Vodacom M-Pesa' }, { code: 'TIGO_TZ', name: 'Tigo Pesa' }, { code: 'AIRTEL_TZ', name: 'Airtel Money' }, { code: 'HALOPESA_TZ', name: 'Halopesa' }] },
  { countryCode: 'RW', countryNameFr: 'Rwanda', countryNameEn: 'Rwanda', currency: 'RWF', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 18.00, requiredFields: ['taxId'], legalMentionsTemplate: 'TIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MTN_RW', name: 'MTN MoMo' }, { code: 'AIRTEL_RW', name: 'Airtel Money' }] },
  { countryCode: 'ZM', countryNameFr: 'Zambie', countryNameEn: 'Zambia', currency: 'ZMW', taxIdLabel: 'TPIN', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'], legalMentionsTemplate: 'TPIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MTN_ZM', name: 'MTN MoMo' }, { code: 'AIRTEL_ZM', name: 'Airtel Money' }, { code: 'ZAMTEL_ZM', name: 'Zamtel' }] },
  { countryCode: 'MW', countryNameFr: 'Malawi', countryNameEn: 'Malawi', currency: 'MWK', taxIdLabel: 'TPIN', rccmLabel: 'Reg. No.', vatRate: 16.50, requiredFields: ['taxId'], legalMentionsTemplate: 'TPIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'AIRTEL_MW', name: 'Airtel Money' }, { code: 'TNM_MW', name: 'TNM Mpamba' }] },
  { countryCode: 'MZ', countryNameFr: 'Mozambique', countryNameEn: 'Mozambique', currency: 'MZN', taxIdLabel: 'NUIT', rccmLabel: 'Reg. No.', vatRate: 16.00, requiredFields: ['taxId'], legalMentionsTemplate: 'NUIT : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MPESA_MZ', name: 'Vodacom M-Pesa' }, { code: 'MOVITEL_MZ', name: 'Movitel e-Mola' }] },
  { countryCode: 'LS', countryNameFr: 'Lesotho', countryNameEn: 'Lesotho', currency: 'LSL', taxIdLabel: 'TIN', rccmLabel: 'Reg. No.', vatRate: 15.00, requiredFields: ['taxId'], legalMentionsTemplate: 'TIN : {taxId} — TVA : {vatRate}%', isPawaPayEnabled: true, paymentOperators: [{ code: 'MPESA_LS', name: 'Vodacom M-Pesa' }, { code: 'ECONET_LS', name: 'Econet EcoCash' }] },
  // Non-pawaPay (backward compat)
  { countryCode: 'TG', countryNameFr: 'Togo', countryNameEn: 'Togo', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'], legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: false, paymentOperators: null },
  { countryCode: 'ML', countryNameFr: 'Mali', countryNameEn: 'Mali', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 18.00, requiredFields: ['taxId','rccm','legalAddress'], legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: false, paymentOperators: null },
  { countryCode: 'NE', countryNameFr: 'Niger', countryNameEn: 'Niger', currency: 'XOF', taxIdLabel: 'IFU', rccmLabel: 'RCCM', vatRate: 19.00, requiredFields: ['taxId','rccm','legalAddress'], legalMentionsTemplate: 'IFU : {taxId} — RCCM : {rccm} — TVA : {vatRate}%', isPawaPayEnabled: false, paymentOperators: null },
];

async function seedCountries() {
  for (const country of COUNTRIES) {
    const data = {
      ...country,
      vatRate: country.vatRate,
      requiredFields: country.requiredFields as string[],
      isPawaPayEnabled: country.isPawaPayEnabled,
      paymentOperators: country.paymentOperators ?? undefined,
    };
    await prisma.countryTaxConfig.upsert({
      where: { countryCode: country.countryCode },
      update: data,
      create: data,
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
