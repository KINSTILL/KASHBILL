-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'BLOG',
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "articles_unified" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "tags" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "readingTime" INTEGER NOT NULL DEFAULT 0,
    "authorName" TEXT NOT NULL DEFAULT 'MyCashBill',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_unified_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_unified_slug_key" ON "articles_unified"("slug");

-- CreateIndex
CREATE INDEX "articles_unified_category_locale_published_idx" ON "articles_unified"("category", "locale", "published");

-- CreateIndex
CREATE INDEX "articles_unified_locale_published_createdAt_idx" ON "articles_unified"("locale", "published", "createdAt");

-- CreateIndex
CREATE INDEX "Article_category_locale_published_idx" ON "Article"("category", "locale", "published");
