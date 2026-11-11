-- CreateEnum
CREATE TYPE "EInvoiceFormat" AS ENUM ('NONE', 'UBL', 'CII', 'FACTURX');

-- AlterTable
ALTER TABLE "CountryTaxConfig" ADD COLUMN "einvoiceFormat" "EInvoiceFormat" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN "xmlPayload" TEXT,
ADD COLUMN "xmlGeneratedAt" TIMESTAMP(3);
