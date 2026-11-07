-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "country" TEXT;

-- AlterTable
ALTER TABLE "CountryTaxConfig" ADD COLUMN     "isPawaPayEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentOperators" JSONB;
