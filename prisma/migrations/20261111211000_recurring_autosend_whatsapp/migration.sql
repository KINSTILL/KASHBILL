-- La programmation envoie désormais par WhatsApp (plus d'envoi par email). Données conservées.
ALTER TABLE "RecurringSchedule" RENAME COLUMN "autoSendEmail" TO "autoSendWhatsApp";
