import { z } from 'zod';
import { normalizeCameroonPhone } from './phone';
import { isValidPin } from './pin';

const phoneSchema = z
  .string()
  .transform((v) => normalizeCameroonPhone(v))
  .refine((v): v is string => v !== null, { message: 'Numéro de téléphone invalide' });

const pinSchema = z
  .string()
  .refine((v) => isValidPin(v), { message: 'PIN doit être 6 chiffres' });

const localeSchema = z.enum(['FR', 'EN']).optional().default('FR');

const deviceIdSchema = z.string().min(1, 'deviceId requis');
const deviceNameSchema = z.string().max(120).optional();

export const registerSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
  name: z.string().min(1).max(120).optional(),
  businessName: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  locale: localeSchema,
  deviceId: deviceIdSchema,
  deviceName: deviceNameSchema,
  referredByCode: z.string().length(8).optional(),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
  deviceId: deviceIdSchema,
  deviceName: deviceNameSchema,
});

export const deviceApprovalRequestSchema = z.object({
  deviceId: deviceIdSchema,
  deviceName: deviceNameSchema,
});

export const deviceApprovalApproveSchema = z.object({
  approvalId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Code à 6 chiffres requis'),
});

export const recoveryUseSchema = z.object({
  phone: phoneSchema,
  recoveryCode: z.string().min(1),
  newPin: pinSchema,
  deviceId: deviceIdSchema,
  deviceName: deviceNameSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type DeviceApprovalRequestInput = z.infer<typeof deviceApprovalRequestSchema>;
export type DeviceApprovalApproveInput = z.infer<typeof deviceApprovalApproveSchema>;
export type RecoveryUseInput = z.infer<typeof recoveryUseSchema>;

