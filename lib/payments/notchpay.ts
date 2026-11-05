import { env } from '@/lib/env';
import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE = env.NOTCHPAY_BASE_URL;

export type NotchPayInitResult =
  | { ok: true; reference: string; authorizationUrl: string; providerRef: string }
  | { ok: false; reason: 'PROVIDER_ERROR'; status?: number; details?: unknown };

export type NotchPayInitInput = {
  amountXaf: number;
  currency: 'XAF';
  reference: string;           // notre ID de transaction (Subscription.id à créer)
  description: string;
  customerPhone: string;       // +237XXXXXXXX
  customerName: string;
  callbackUrl: string;         // URL de retour côté app
};

/**
 * Initialise un paiement Notch Pay.
 * https://notchpay.dev/docs
 */
export async function initNotchPayPayment(input: NotchPayInitInput): Promise<NotchPayInitResult> {
  const body = {
    amount: input.amountXaf,
    currency: input.currency,
    reference: input.reference,
    description: input.description,
    customer: {
      name: input.customerName,
      phone: input.customerPhone,
    },
    callback: input.callbackUrl,
    // Canaux acceptés : Orange Money CM + MTN MoMo CM
    channels: ['cm.orange', 'cm.mtn'],
  };

  try {
    const res = await fetch(`${BASE}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: env.NOTCHPAY_PUBLIC_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const details = await res.json().catch(() => ({}));
      return { ok: false, reason: 'PROVIDER_ERROR', status: res.status, details };
    }

    const json = await res.json();
    const authorizationUrl = json?.authorization_url;
    const providerRef = json?.transaction?.reference ?? json?.reference;

    if (!authorizationUrl || !providerRef) {
      return { ok: false, reason: 'PROVIDER_ERROR', details: json };
    }

    return { ok: true, reference: input.reference, authorizationUrl, providerRef };
  } catch (err) {
    return { ok: false, reason: 'PROVIDER_ERROR', details: err };
  }
}

/**
 * Vérifie la signature HMAC SHA-256 du webhook Notch Pay.
 * Header : X-Notchpay-Signature (hex)
 * Secret : NOTCHPAY_WEBHOOK_HASH
 */
export function verifyNotchPaySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac('sha256', env.NOTCHPAY_WEBHOOK_HASH)
    .update(rawBody, 'utf8')
    .digest('hex');

  // Comparaison timing-safe
  const a = Buffer.from(signatureHeader, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

