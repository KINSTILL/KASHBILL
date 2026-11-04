-- CreateEnum
CREATE TYPE "FraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FraudStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISMISSED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPPORT';

-- AlterEnum
ALTER TYPE "SubSource" ADD VALUE IF NOT EXISTS 'TRIAL';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "targetId" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "editCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qrCodeUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedById" TEXT,
ADD COLUMN     "cgvText" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'CM',
ADD COLUMN     "duplicationsThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "footerText" TEXT,
ADD COLUMN     "headerText" TEXT,
ADD COLUMN     "lastAdminLoginAt" TIMESTAMP(3),
ADD COLUMN     "legalAddress" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "monthlyCountersResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "productPhotosCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rccm" TEXT,
ADD COLUMN     "renumerationsThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "signatureUrl" TEXT,
ADD COLUMN     "stampUrl" TEXT,
ADD COLUMN     "suspendReason" TEXT,
ADD COLUMN     "suspendedUntil" TIMESTAMP(3),
ADD COLUMN     "taxId" TEXT;

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docType" "DocType" NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVerification" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "isAuthentic" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryTaxConfig" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryNameFr" TEXT NOT NULL,
    "countryNameEn" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "taxIdLabel" TEXT NOT NULL,
    "rccmLabel" TEXT NOT NULL,
    "vatRate" DECIMAL(5,2),
    "requiredFields" JSONB NOT NULL,
    "legalMentionsTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryTaxConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudThreshold" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "ceiling" INTEGER NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "documentId" TEXT,
    "reason" TEXT NOT NULL,
    "details" JSONB,
    "severity" "FraudSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "FraudStatus" NOT NULL DEFAULT 'PENDING',
    "autoDetected" BOOLEAN NOT NULL DEFAULT true,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_userId_docType_year_key" ON "DocumentSequence"("userId", "docType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVerification_documentId_key" ON "DocumentVerification"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVerification_publicToken_key" ON "DocumentVerification"("publicToken");

-- CreateIndex
CREATE INDEX "DocumentVerification_publicToken_idx" ON "DocumentVerification"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "CountryTaxConfig_countryCode_key" ON "CountryTaxConfig"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "FraudThreshold_key_key" ON "FraudThreshold"("key");

-- CreateIndex
CREATE INDEX "FraudFlag_status_severity_createdAt_idx" ON "FraudFlag"("status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "FraudFlag_userId_status_idx" ON "FraudFlag"("userId", "status");

-- CreateIndex
CREATE INDEX "FraudFlag_documentId_idx" ON "FraudFlag"("documentId");

-- CreateIndex
CREATE INDEX "BlacklistEntry_type_idx" ON "BlacklistEntry"("type");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistEntry_type_value_key" ON "BlacklistEntry"("type", "value");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetId_createdAt_idx" ON "AuditLog"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_contentHash_idx" ON "Document"("contentHash");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE INDEX "User_flaggedForReview_idx" ON "User"("flaggedForReview");

-- AddForeignKey
ALTER TABLE "DocumentSequence" ADD CONSTRAINT "DocumentSequence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVerification" ADD CONSTRAINT "DocumentVerification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudThreshold" ADD CONSTRAINT "FraudThreshold_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudFlag" ADD CONSTRAINT "FraudFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudFlag" ADD CONSTRAINT "FraudFlag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudFlag" ADD CONSTRAINT "FraudFlag_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistEntry" ADD CONSTRAINT "BlacklistEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER : Protection du dernier ADMIN
-- Empêche la suppression du dernier compte ADMIN en base
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION prevent_last_admin_removal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'ADMIN' AND NEW.role <> 'ADMIN' THEN
    IF (SELECT COUNT(*) FROM "User" WHERE role = 'ADMIN' AND id <> OLD.id) = 0 THEN
      RAISE EXCEPTION 'Impossible de supprimer le dernier ADMIN';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_last_admin_removal
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION prevent_last_admin_removal();

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS : AuditLog append-only
-- Empêche tout UPDATE et DELETE sur les logs d'audit
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION prevent_auditlog_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog est append-only : UPDATE et DELETE interdits';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_auditlog_update
BEFORE UPDATE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_auditlog_mutation();

CREATE TRIGGER trg_prevent_auditlog_delete
BEFORE DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_auditlog_mutation();
