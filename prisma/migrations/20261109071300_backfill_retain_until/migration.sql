-- Backfill : watermarked=false (créé en Pro) → 365j, watermarked=true → 30j
UPDATE "Document"
SET "retainUntil" = CASE
  WHEN "watermarked" = false THEN "createdAt" + INTERVAL '365 days'
  ELSE "createdAt" + INTERVAL '30 days'
END
WHERE "retainUntil" IS NULL;
