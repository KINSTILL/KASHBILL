-- Type d'add-on porté par la subscription (nouveaux achats).
-- Nullable : les subscriptions historiques conservent NULL et sont typées via
-- le repli par montant dans le webhook de paiement.
ALTER TABLE "Subscription" ADD COLUMN "addOnType" "AddOnType";
