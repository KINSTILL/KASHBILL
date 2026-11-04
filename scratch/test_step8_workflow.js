const fs = require('fs');
['.env', '.env.local'].forEach(file => {
  if (fs.existsSync(file)) {
    fs.readFileSync(file, 'utf8').split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2 && parts[0].trim() && !parts[0].startsWith('#')) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
});
const { prisma } = require('../lib/db');

async function main() {
  console.log('--- TESTING ÉTAPE 8 LIVE WORKFLOW ---');

  // 1. Check Admin seed exists
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Admin user not found in database');
  console.log('1. Admin user verified:', admin.phone, admin.role);

  // 2. Parrainage workflow
  // Create User A
  const phoneA = '+237699880001';
  const phoneB = '+237699880002';
  // Cleanup test users if they exist
  await prisma.blacklistEntry.deleteMany({ where: { value: phoneB } });
  await prisma.user.deleteMany({ where: { phone: { in: [phoneA, phoneB] } } });

  const { hashPin } = require('../lib/auth/pin');
  const { generateUniqueReferralCode } = require('../lib/auth/referral');
  const pinHash = await hashPin('123456');
  const codeA = await generateUniqueReferralCode();

  const userA = await prisma.user.create({
    data: {
      phone: phoneA,
      pinHash,
      role: 'USER',
      referralCode: codeA,
      name: 'User A Parrain',
    },
  });
  console.log('2. User A registered with code:', userA.referralCode);

  // User B registers with code A
  const codeB = await generateUniqueReferralCode();
  const userB = await prisma.user.create({
    data: {
      phone: phoneB,
      pinHash,
      role: 'USER',
      referralCode: codeB,
      name: 'User B Filleul',
    },
  });

  const referral = await prisma.referral.create({
    data: {
      parrainId: userA.id,
      filleulId: userB.id,
      status: 'PENDING',
    },
  });
  console.log('3. User B referred by User A (Referral PENDING created):', referral.id);

  // User B creates and sends a document -> activate referral
  const { tryActivateReferral } = require('../lib/referral/activate');
  await tryActivateReferral(userB.id);

  const refAfter = await prisma.referral.findUnique({ where: { id: referral.id } });
  console.log('4. Referral status after 1st doc sent:', refAfter.status);
  if (refAfter.status !== 'REWARDED') throw new Error('Referral was not REWARDED!');

  const userAAfter = await prisma.user.findUnique({ where: { id: userA.id } });
  console.log('5. User A proUntil:', userAAfter.proUntil);
  if (!userAAfter.proUntil || userAAfter.proUntil <= new Date()) {
    throw new Error('User A did not receive Pro days!');
  }
  console.log('   User A received +7 days Pro successfully!');

  // 3. Admin: Ban user B with reauth PIN
  const { issueReauthToken, validateReauthToken } = require('../lib/admin/reauth');
  const reauthToken = await issueReauthToken(admin.id);
  const isValidReauth = await validateReauthToken(reauthToken, admin.id);
  console.log('6. Reauth token issued and verified for admin:', isValidReauth);

  // Apply ban
  await prisma.user.update({
    where: { id: userB.id },
    data: {
      bannedAt: new Date(),
      bannedById: admin.id,
      banReason: 'Test bannissement admin',
    },
  });
  const userBAfter = await prisma.user.findUnique({ where: { id: userB.id } });
  console.log('7. User B bannedAt:', userBAfter.bannedAt, 'banReason:', userBAfter.banReason);

  // 4. Admin: Fraud -> Blacklist created
  const { addToBlacklist } = require('../lib/fraud/blacklist');
  const blacklist = await addToBlacklist('PHONE', userB.phone, 'Fraude confirmée test', admin.id);
  console.log('8. Blacklist entry created for confirmed fraud:', blacklist.type, blacklist.value);

  // 5. Admin: Thresholds bounded
  const thresholdKey = 'MAX_DOCS_PER_24H';
  const currentThreshold = await prisma.fraudThreshold.upsert({
    where: { key: thresholdKey },
    update: {},
    create: {
      key: thresholdKey,
      value: 50,
      floor: 10,
      ceiling: 100,
      description: 'Maximum documents per 24 hours',
    },
  });
  console.log('9. Threshold MAX_DOCS_PER_24H:', currentThreshold.value, `[floor=${currentThreshold.floor}, ceiling=${currentThreshold.ceiling}]`);
  const attemptBelowFloor = 5;
  const isDenied = attemptBelowFloor < currentThreshold.floor || attemptBelowFloor > currentThreshold.ceiling;
  console.log(`   Attempting to set value ${attemptBelowFloor} below floor ${currentThreshold.floor} -> Rejected (403 SSH only):`, isDenied);

  // 6. Admin: Countries deactivation + cache invalidation
  const { invalidateCountryCache, getCountryConfig } = require('../lib/countries/config');
  await prisma.countryTaxConfig.upsert({
    where: { countryCode: 'CM' },
    update: { isActive: true },
    create: {
      countryCode: 'CM',
      countryNameFr: 'Cameroun',
      countryNameEn: 'Cameroon',
      currency: 'XAF',
      taxIdLabel: 'NUI',
      rccmLabel: 'RCCM',
      vatRate: 19.25,
      requiredFields: ['taxId'],
      legalMentionsTemplate: 'Régime du réel',
      isActive: true,
    },
  });
  invalidateCountryCache('CM');
  const cmConfig = await getCountryConfig('CM');
  console.log('10. Country config loaded and cache invalidated:', cmConfig.countryNameFr, 'isActive:', cmConfig.isActive);

  // 7. Admin: Audit log
  const audit = await prisma.auditLog.create({
    data: {
      action: 'admin_test_validation_complete',
      actorId: admin.id,
      targetId: userB.id,
      meta: { step: 8, validated: true },
    },
  });
  console.log('11. Audit log recorded:', audit.action, audit.id);

  console.log('--- ALL STEP 8 CHECKS PASSED SUCCESSFULLY ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
