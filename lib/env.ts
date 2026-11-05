import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
  JWT_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  ADMIN_PHONE: z.string().regex(/^\+2376\d{8}$/, 'ADMIN_PHONE doit être au format +2376XXXXXXXX'),
  ADMIN_PIN: z.string().regex(/^\d{6}$/, 'ADMIN_PIN doit être 6 chiffres'),
  APP_URL: z.string().url(),
  APP_NAME: z.string().default('CashBill'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NOTCHPAY_PUBLIC_KEY: z.string().min(1),
  NOTCHPAY_HASH_KEY: z.string().min(1),
  NOTCHPAY_WEBHOOK_HASH: z.string().min(1),
  NOTCHPAY_BASE_URL: z.string().url().default('https://api.notchpay.co'),
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
});

if (!parsed.success) {
  console.error('❌ Variables d’environnement invalides :');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('ENV_VALIDATION_FAILED');
}

export const env = parsed.data;

