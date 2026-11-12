-- Ajout du réglage de précision des montants sur les documents.
-- 0 = entiers (défaut, conformité XAF), 1 ou 2 = décimales.
ALTER TABLE "User" ADD COLUMN "decimalPlaces" INTEGER NOT NULL DEFAULT 0;
