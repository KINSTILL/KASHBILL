import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
  JWT_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  ADMIN_PHONE: z
    .string()
    .regex(
      /^\+2376\d{8}(?:[,\s;]+\+2376\d{8})*$/,
      'ADMIN_PHONE doit être au format +2376XXXXXXXX (ou séparés par des virgules)'
    ),
  ADMIN_PIN: z.string().regex(/^\d{6}$/, 'ADMIN_PIN doit être 6 chiffres'),
  APP_URL: z.string().url(),
  APP_NAME: z.string().default('MyCashBill'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NOTCHPAY_PUBLIC_KEY: z.string().min(1),
  NOTCHPAY_HASH_KEY: z.string().min(1),
  NOTCHPAY_WEBHOOK_HASH: z.string().min(1),
  NOTCHPAY_BASE_URL: z.string().url().default('https://api.notchpay.co'),
  CRON_SECRET: z.string().min(16),
  // Facture d'abonnement — tous optionnels, défauts sûrs
  RESEND_ENABLED: z.enum(['true', 'false']).default('false'),
  RESEND_API_KEY: z.string().optional(),
  UPLOAD_ENCRYPTION_KEY: z.string().regex(/^[a-f0-9]{64}$/, 'UPLOAD_ENCRYPTION_KEY doit être 64 hex chars (32 bytes)'),
  RESEND_FROM_EMAIL: z.string().email().default('support@mycashbill.app'),
  RESEND_FROM_NAME: z.string().default('MyCashBill'),
  RESEND_REPLY_TO: z.string().email().optional(),
  PLATFORM_LEGAL_NAME: z.string().default('MyCashBill'),
  PLATFORM_TAX_ID: z.string().default('À_COMPLÉTER'),
  PLATFORM_RCCM: z.string().default('À_COMPLÉTER'),
  PLATFORM_ADDRESS: z.string().default('À_COMPLÉTER'),
  PLATFORM_CITY: z.string().default('Douala'),
  PLATFORM_COUNTRY: z.string().length(2).default('CM'),
  PLATFORM_PHONE: z.string().default('+237600000000'),
  PLATFORM_EMAIL: z.string().email().default('support@mycashbill.app'),
  PLATFORM_WEB: z.string().url().default('https://mycashbill.app'),
  PLATFORM_LOGO_URL: z.string().default('/icons/logo-platform.png'),
  PLATFORM_VAT_REGISTERED: z.enum(['true', 'false']).default('false'),
  PLATFORM_VAT_RATE: z.coerce.number().min(0).max(30).default(0),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_DAYS: process.env.JWT_EXPIRES_DAYS,
  ADMIN_PHONE: process.env.ADMIN_PHONE,
  ADMIN_PIN: process.env.ADMIN_PIN,
  APP_URL: process.env.APP_URL,
  APP_NAME: process.env.APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
  NOTCHPAY_PUBLIC_KEY: process.env.NOTCHPAY_PUBLIC_KEY,
  NOTCHPAY_HASH_KEY: process.env.NOTCHPAY_HASH_KEY,
  NOTCHPAY_WEBHOOK_HASH: process.env.NOTCHPAY_WEBHOOK_HASH,
  NOTCHPAY_BASE_URL: process.env.NOTCHPAY_BASE_URL,
  CRON_SECRET: process.env.CRON_SECRET,
  RESEND_ENABLED: process.env.RESEND_ENABLED,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  UPLOAD_ENCRYPTION_KEY: process.env.UPLOAD_ENCRYPTION_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
  RESEND_REPLY_TO: process.env.RESEND_REPLY_TO,
  PLATFORM_LEGAL_NAME: process.env.PLATFORM_LEGAL_NAME,
  PLATFORM_TAX_ID: process.env.PLATFORM_TAX_ID,
  PLATFORM_RCCM: process.env.PLATFORM_RCCM,
  PLATFORM_ADDRESS: process.env.PLATFORM_ADDRESS,
  PLATFORM_CITY: process.env.PLATFORM_CITY,
  PLATFORM_COUNTRY: process.env.PLATFORM_COUNTRY,
  PLATFORM_PHONE: process.env.PLATFORM_PHONE,
  PLATFORM_EMAIL: process.env.PLATFORM_EMAIL,
  PLATFORM_WEB: process.env.PLATFORM_WEB,
  PLATFORM_LOGO_URL: process.env.PLATFORM_LOGO_URL,
  PLATFORM_VAT_REGISTERED: process.env.PLATFORM_VAT_REGISTERED,
  PLATFORM_VAT_RATE: process.env.PLATFORM_VAT_RATE,
});

const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build' ||
  process.env.SKIP_ENV_VALIDATION === '1';

let envData: z.infer<typeof envSchema>;

if (parsed.success) {
  envData = parsed.data;
} else if (isBuildPhase) {
  console.warn(
    '⚠️ Build phase: Variables d’environnement manquantes ou partielles. Utilisation de valeurs de substitution temporaires pour compiler le build.'
  );
  const fallbackValues = {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://build:build@localhost:5432/build',
    JWT_SECRET: process.env.JWT_SECRET || 'build-secret-at-least-32-chars-long-placeholder',
    JWT_EXPIRES_DAYS: process.env.JWT_EXPIRES_DAYS || 7,
    ADMIN_PHONE: process.env.ADMIN_PHONE || '+237699000000',
    ADMIN_PIN: process.env.ADMIN_PIN || '000000',
    APP_URL: process.env.APP_URL || 'https://mycashbill.app',
    APP_NAME: process.env.APP_NAME || 'MyCashBill',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://mycashbill.app',
    NODE_ENV: process.env.NODE_ENV || 'production',
    NOTCHPAY_PUBLIC_KEY: process.env.NOTCHPAY_PUBLIC_KEY || 'pk_build_placeholder',
    NOTCHPAY_HASH_KEY: process.env.NOTCHPAY_HASH_KEY || 'sk_build_placeholder',
    NOTCHPAY_WEBHOOK_HASH: process.env.NOTCHPAY_WEBHOOK_HASH || 'whsec_build_placeholder',
    NOTCHPAY_BASE_URL: process.env.NOTCHPAY_BASE_URL || 'https://api.notchpay.co',
    CRON_SECRET: process.env.CRON_SECRET || 'build-cron-secret-16-chars',
    RESEND_ENABLED: process.env.RESEND_ENABLED || 'false',
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    UPLOAD_ENCRYPTION_KEY:
      process.env.UPLOAD_ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'support@mycashbill.app',
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME || 'MyCashBill',
    RESEND_REPLY_TO: process.env.RESEND_REPLY_TO,
    PLATFORM_LEGAL_NAME: process.env.PLATFORM_LEGAL_NAME || 'MyCashBill',
    PLATFORM_TAX_ID: process.env.PLATFORM_TAX_ID || 'À_COMPLÉTER',
    PLATFORM_RCCM: process.env.PLATFORM_RCCM || 'À_COMPLÉTER',
    PLATFORM_ADDRESS: process.env.PLATFORM_ADDRESS || 'À_COMPLÉTER',
    PLATFORM_CITY: process.env.PLATFORM_CITY || 'Douala',
    PLATFORM_COUNTRY: process.env.PLATFORM_COUNTRY || 'CM',
    PLATFORM_PHONE: process.env.PLATFORM_PHONE || '+237600000000',
    PLATFORM_EMAIL: process.env.PLATFORM_EMAIL || 'support@mycashbill.app',
    PLATFORM_WEB: process.env.PLATFORM_WEB || 'https://mycashbill.app',
    PLATFORM_LOGO_URL: process.env.PLATFORM_LOGO_URL || '/icons/logo-platform.png',
    PLATFORM_VAT_REGISTERED: process.env.PLATFORM_VAT_REGISTERED || 'false',
    PLATFORM_VAT_RATE: process.env.PLATFORM_VAT_RATE || 0,
  };
  envData = envSchema.parse(fallbackValues);
} else {
  console.error('❌ Variables d’environnement invalides :');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('ENV_VALIDATION_FAILED');
}

export const env = envData;

