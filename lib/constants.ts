// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export const APP_NAME = 'MyCashBill';
export const APP_URL_DEFAULT = 'http://localhost:3000';

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const SESSION_COOKIE = 'mycashbill_session';
export const JWT_EXPIRES_DAYS_USER = 7;
export const JWT_EXPIRES_HOURS_ADMIN = 4;
export const REAUTH_TOKEN_TTL_SECONDS = 120;
export const MAX_ACTIVE_DEVICES_FREE = 1;
export const MAX_ACTIVE_DEVICES_PRO = 2;
export const PIN_LENGTH = 6;
export const RECOVERY_CODES_COUNT = 8;
export const RECOVERY_CODE_LENGTH = 8; // 4 + 4 avec tiret
export const RECOVERY_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const DEVICE_APPROVAL_CODE_LENGTH = 6;
export const DEVICE_APPROVAL_TTL_MINUTES = 5;
export const DEVICE_APPROVAL_MAX_ATTEMPTS = 3;

// ─────────────────────────────────────────────
// Rate limiting (par défaut)
// ─────────────────────────────────────────────
export const RATE_LIMIT_LOGIN_PER_PHONE = { limit: 10, windowMs: 15 * 60 * 1000 };
export const RATE_LIMIT_LOGIN_PER_IP = { limit: process.env.NODE_ENV === 'test' ? 1000 : 20, windowMs: 15 * 60 * 1000 };
export const RATE_LIMIT_REGISTER_PER_PHONE = { limit: process.env.NODE_ENV === 'test' ? 1000 : 5, windowMs: 15 * 60 * 1000 };
export const RATE_LIMIT_REGISTER_PER_IP = { limit: process.env.NODE_ENV === 'test' ? 1000 : 10, windowMs: 15 * 60 * 1000 };
export const RATE_LIMIT_ADMIN_PER_ADMIN = { limit: 30, windowMs: 15 * 60 * 1000 };
export const RATE_LIMIT_RECOVERY_PER_PHONE = { limit: 5, windowMs: 60 * 60 * 1000 };
export const RATE_LIMIT_DEVICE_APPROVAL_PER_USER = { limit: 10, windowMs: 60 * 60 * 1000 };

// ─────────────────────────────────────────────
// Freemium
// ─────────────────────────────────────────────
export const FREE_CLIENTS_LIMIT = 2;
export const FREE_DOCS_PER_MONTH = 10;
export const FREE_WHATSAPP_PER_MONTH = 5;
export const FREE_EMAILS_PER_MONTH = 1;
export const FREE_HISTORY_DAYS = 7;
export const FREE_LOGO_GRACE_DAYS = 7; // logo seul, 7 jours après l'inscription
export const FREE_LOGO_GRACE_DOCS = 5;
export const FREE_PRODUCT_PHOTOS_LIMIT = 10;
export const FREE_DUPLICATIONS_PER_MONTH = 3;
export const FREE_RENUMERATIONS_PER_MONTH = 1;
export const FREE_EDITS_PER_DOCUMENT = 1;
export const TRIAL_DURATION_DAYS = 5;
export const PRO_PRICE_FCFA = 2000;
export const PRO_DURATION_DAYS = 30;

// ─────────────────────────────────────────────
// Parrainage
// ─────────────────────────────────────────────
export const REFERRAL_REWARD_DAYS = 7;
export const REFERRAL_ACTIVATION_WINDOW_DAYS = 7;
export const REFERRAL_MAX_ACCUMULATED_DAYS = 30;
export const REFERRAL_CODE_LENGTH = 8;
export const REFERRAL_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// ─────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────
export const DOCUMENT_NUMBER_PREFIX = 'MCB';
export const DOCUMENT_NUMBER_PADDING = 6;

// ─────────────────────────────────────────────
// Uploads
// ─────────────────────────────────────────────
export const MAX_LOGO_SIZE_BYTES = 200 * 1024; // 200 Ko
export const MAX_SIGNATURE_SIZE_BYTES = 50 * 1024; // 50 Ko
export const MAX_STAMP_SIZE_BYTES = 50 * 1024; // 50 Ko
export const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg'] as const;

// ─────────────────────────────────────────────
// Share (Bouclier Social)
// ─────────────────────────────────────────────
export const SHARE_PREFS_STORAGE_KEY = 'mycashbill:share-prefs:v1';
export const SHARE_MESSAGE_MAX_LENGTH = 1500;

