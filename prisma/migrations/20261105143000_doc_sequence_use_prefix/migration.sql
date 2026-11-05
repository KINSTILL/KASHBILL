-- DropIndex
DROP INDEX "DocumentSequence_userId_docType_year_key";

-- AlterTable
ALTER TABLE "DocumentSequence" ADD COLUMN "prefix" TEXT;
UPDATE "DocumentSequence" SET "prefix" = 'F' WHERE "docType" = 'FACTURE';
UPDATE "DocumentSequence" SET "prefix" = 'DV' WHERE "docType" = 'DEVIS';
UPDATE "DocumentSequence" SET "prefix" = 'FP' WHERE "docType" = 'PROFORMA';
UPDATE "DocumentSequence" SET "prefix" = 'BC' WHERE "docType" = 'BON_COMMANDE';
UPDATE "DocumentSequence" SET "prefix" = 'BL' WHERE "docType" = 'BORDEREAU';
UPDATE "DocumentSequence" SET "prefix" = 'R' WHERE "docType" = 'RECU';
UPDATE "DocumentSequence" SET "prefix" = 'T' WHERE "docType" = 'TICKET';
ALTER TABLE "DocumentSequence" ALTER COLUMN "prefix" SET NOT NULL;
ALTER TABLE "DocumentSequence" DROP COLUMN "docType";

-- CreateIndex
CREATE INDEX "DocumentSequence_userId_prefix_idx" ON "DocumentSequence"("userId", "prefix");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_userId_prefix_year_key" ON "DocumentSequence"("userId", "prefix", "year");

