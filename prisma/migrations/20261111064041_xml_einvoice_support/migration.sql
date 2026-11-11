-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EInvoiceFormat" AS ENUM ('NONE', 'UBL', 'CII', 'FACTURX');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EInvoiceRegulatoryStatus" AS ENUM ('NONE', 'UPCOMING', 'MANDATORY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "CountryTaxConfig"
  ADD COLUMN IF NOT EXISTS "einvoiceFormat" "EInvoiceFormat" NOT NULL DEFAULT 'UBL',
  ADD COLUMN IF NOT EXISTS "einvoiceRegulatoryStatus" "EInvoiceRegulatoryStatus" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "xmlPayload" TEXT,
  ADD COLUMN IF NOT EXISTS "xmlGeneratedAt" TIMESTAMP(3);
