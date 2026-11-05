import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

export default async function globalSetup() {
  const dbUrl = (process.env.DATABASE_URL || 'postgresql://mycashbill:mycashbill@localhost:5433/mycashbill').replace(/\/[^/]+$/, '/mycashbill_test');
  process.env.DATABASE_URL = dbUrl;

  try {
    execSync('pnpm prisma migrate deploy', { stdio: 'inherit', env: process.env, shell: true as unknown as string });
  } catch (err) {
    console.error('Migration failed in global-setup:', err);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "AuditLog", "FraudFlag", "BlacklistEntry", "DocumentVerification",
        "DocumentSequence", "Document", "Client", "Subscription", "Referral",
        "RecoveryCode", "DeviceApproval", "Device", "User",
        "CountryTaxConfig", "FraudThreshold"
      RESTART IDENTITY CASCADE
    `);
  } catch (err) {
    console.error('Truncate failed in global-setup:', err);
  } finally {
    await prisma.$disconnect();
  }

  try {
    execSync('pnpm exec dotenv -e .env.test -- tsx prisma/seed.ts', { stdio: 'inherit', env: process.env, shell: true as unknown as string });
  } catch (err) {
    console.error('Seed failed in global-setup:', err);
  }
}

