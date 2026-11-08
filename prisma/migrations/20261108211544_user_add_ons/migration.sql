-- CreateEnum
CREATE TYPE "AddOnType" AS ENUM ('EXTRA_DEVICE', 'WHITE_LABEL');

-- CreateTable
CREATE TABLE "UserAddOn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AddOnType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "amountXaf" INTEGER NOT NULL,
    "subscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAddOn_userId_type_endsAt_idx" ON "UserAddOn"("userId", "type", "endsAt");

-- AddForeignKey
ALTER TABLE "UserAddOn" ADD CONSTRAINT "UserAddOn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddOn" ADD CONSTRAINT "UserAddOn_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
