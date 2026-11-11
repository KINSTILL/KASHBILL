/*
  Warnings:

  - You are about to drop the column `currency` on the `CountryTaxConfig` table. All the data in the column will be lost.
  - You are about to drop the column `rccmLabel` on the `CountryTaxConfig` table. All the data in the column will be lost.
  - You are about to drop the column `taxIdLabel` on the `CountryTaxConfig` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EInvoiceRegulatoryStatus" AS ENUM ('NONE', 'UPCOMING', 'MANDATORY');

-- AlterTable
ALTER TABLE "CountryTaxConfig" DROP COLUMN "currency",
DROP COLUMN "rccmLabel",
DROP COLUMN "taxIdLabel";
