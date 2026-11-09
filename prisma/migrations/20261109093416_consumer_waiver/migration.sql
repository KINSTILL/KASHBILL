-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PROFESSIONAL', 'CONSUMER');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "consumerWithdrawalWaivedAt" TIMESTAMP(3),
ADD COLUMN     "consumerWithdrawalWaiver" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'PROFESSIONAL',
ADD COLUMN     "consumerWaiverAcceptedAt" TIMESTAMP(3);
