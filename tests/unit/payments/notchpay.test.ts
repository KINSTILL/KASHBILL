import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyNotchPaySignature } from '@/lib/payments/notchpay';
import { env } from '@/lib/env';

describe('verifyNotchPaySignature', () => {
  const body = JSON.stringify({ event: 'payment.complete', data: { reference: 'test' } });
  const validSig = createHmac('sha256', env.NOTCHPAY_WEBHOOK_HASH).update(body).digest('hex');

  it('accepte une signature valide', () => {
    expect(verifyNotchPaySignature(body, validSig)).toBe(true);
  });

  it('rejette une signature invalide', () => {
    expect(verifyNotchPaySignature(body, 'deadbeef')).toBe(false);
  });

  it('rejette une signature absente', () => {
    expect(verifyNotchPaySignature(body, null)).toBe(false);
  });

  it('rejette si le body a été modifié', () => {
    const tampered = body.replace('test', 'hacked');
    expect(verifyNotchPaySignature(tampered, validSig)).toBe(false);
  });
});

