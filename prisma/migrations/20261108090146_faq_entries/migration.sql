-- CreateTable
CREATE TABLE "FAQEntry" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "locale" "Locale" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "notHelpful" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FAQEntry_category_locale_order_idx" ON "FAQEntry"("category", "locale", "order");

-- CreateIndex
CREATE INDEX "FAQEntry_isPublished_idx" ON "FAQEntry"("isPublished");
