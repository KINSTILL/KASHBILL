-- Le journal d'audit est append-only (triggers UPDATE/DELETE interdits).
-- Les clés étrangères ON DELETE SET NULL vers "User" provoquaient un UPDATE implicite
-- lors de la suppression d'un compte. On les retire : userId/actorId deviennent de
-- simples identifiants conservés dans le journal. Les triggers restent inchangés.
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_actorId_fkey";

