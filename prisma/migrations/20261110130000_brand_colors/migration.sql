-- White-label brand colors (additive, nullable; default palette applied when NULL)
ALTER TABLE "User" ADD COLUMN "brandPrimaryColor" TEXT;
ALTER TABLE "User" ADD COLUMN "brandAccentColor" TEXT;
