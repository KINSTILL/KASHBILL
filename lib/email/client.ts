import { Resend } from 'resend';
import { env } from '@/lib/env';

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

export const EMAIL_FROM = `${env.APP_NAME} <noreply@mycashbill.app>`;
