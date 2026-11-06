-- Legal header fields (additive, nullable)
ALTER TABLE "User"     ADD COLUMN "legalForm" TEXT;
ALTER TABLE "Client"   ADD COLUMN "taxId" TEXT;
ALTER TABLE "Document" ADD COLUMN "dueDate" TIMESTAMP(3);
