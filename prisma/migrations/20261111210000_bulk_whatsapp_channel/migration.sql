-- Envoi en masse par WhatsApp (les valeurs historiques restent pour les lignes existantes)
ALTER TYPE "BulkChannel" ADD VALUE IF NOT EXISTS 'WHATSAPP';
ALTER TYPE "BulkStatus" ADD VALUE IF NOT EXISTS 'FAILED';
