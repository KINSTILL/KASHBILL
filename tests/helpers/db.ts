import { prisma } from '@/lib/db';

/**
 * Vide complètement la base de test.
 * Utilise TRUNCATE CASCADE qui bypasse les triggers DELETE/UPDATE
 * (mais PAS les triggers TRUNCATE — on n'en a pas).
 */
export async function clearDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog", "FraudFlag", "BlacklistEntry", "DocumentVerification",
      "DocumentSequence", "Document", "Client", "Subscription", "Referral",
      "RecoveryCode", "DeviceApproval", "Device", "User",
      "CountryTaxConfig", "FraudThreshold"
    RESTART IDENTITY CASCADE
  `);
}

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}

