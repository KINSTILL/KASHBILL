import { createHmac } from 'node:crypto';
import { prisma } from '../lib/db';
import { env } from '../lib/env';

async function main() {
  console.log('=== TEST WORKFLOW ÉTAPE 9 : NOTCH PAY + PWA ===');

  // 1. Inscription d'un utilisateur de test
  const testPhone = '+237699990099';
  await prisma.user.deleteMany({ where: { phone: testPhone } });

  const regRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: JSON.stringify({
      phone: testPhone,
      pin: '123456',
      deviceId: 'device-notch-test-1',
      locale: 'FR',
    }),
  });
  console.log('Register status:', regRes.status);
  const regJson = await regRes.json();
  const userId = regJson.user.id;
  const cookie = regRes.headers.get('set-cookie')?.match(/cashbill_session=([^;]+)/)?.[1] ?? '';
  console.log('User registered:', userId, 'Initial proUntil:', regJson.user.proUntil);

  // 2. Création de la subscription (comme lors d'une initialisation)
  const providerRef = 'NOTCH_SANDBOX_TX_' + Date.now();
  const sub = await prisma.subscription.create({
    data: {
      userId,
      source: 'NOTCH_PAY',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amountXaf: 2000,
      providerRef,
    },
  });
  console.log('Created subscription:', sub.id, 'providerRef:', providerRef);

  // 3. Test Webhook avec signature invalide -> 401
  const badBody = JSON.stringify({
    event: 'payment.complete',
    data: { reference: providerRef, status: 'complete', amount: 2000 },
  });
  const badSigRes = await fetch('http://localhost:3000/api/webhooks/notchpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Notchpay-Signature': 'deadbeef-invalid-sig',
    },
    body: badBody,
  });
  console.log('Webhook bad signature status:', badSigRes.status, '(expected 401)');
  if (badSigRes.status !== 401) {
    throw new Error('Expected 401 for invalid signature');
  }

  // 4. Test Webhook avec signature HMAC valide -> 200 Pro activé
  const validSig = createHmac('sha256', env.NOTCHPAY_WEBHOOK_HASH).update(badBody).digest('hex');
  const validSigRes = await fetch('http://localhost:3000/api/webhooks/notchpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Notchpay-Signature': validSig,
    },
    body: badBody,
  });
  const validSigJson = await validSigRes.json();
  console.log('Webhook valid signature status:', validSigRes.status, validSigJson, '(expected 200)');
  if (validSigRes.status !== 200 || !validSigJson.received) {
    throw new Error('Expected 200 and received: true');
  }

  // Vérifier en base que le user est bien Pro
  const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
  const proTime = updatedUser?.proUntil?.getTime() ?? 0;
  console.log('Updated user proUntil:', updatedUser?.proUntil, 'Extended > 25 days:', proTime > Date.now() + 25 * 24 * 60 * 60 * 1000);
  if (proTime < Date.now() + 25 * 24 * 60 * 60 * 1000) {
    throw new Error('User proUntil was not extended properly');
  }

  // 5. Test Webhook Idempotence -> 200 already_processed
  const retrySigRes = await fetch('http://localhost:3000/api/webhooks/notchpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Notchpay-Signature': validSig,
    },
    body: badBody,
  });
  const retryJson = await retrySigRes.json();
  console.log('Webhook retry idempotence status:', retrySigRes.status, retryJson, '(expected already_processed)');
  if (retryJson.ignored !== 'already_processed') {
    throw new Error('Expected already_processed');
  }

  const userAfterRetry = await prisma.user.findUnique({ where: { id: userId } });
  if (userAfterRetry?.proUntil?.getTime() !== proTime) {
    throw new Error('Idempotence failed: user proUntil was modified on retry');
  }
  console.log('Idempotence verified: proUntil unchanged on second webhook call.');

  // 6. Test audit log
  const audit = await prisma.auditLog.findFirst({
    where: {
      action: 'payment_completed',
      actorId: userId,
    },
  });
  console.log('Audit log found:', audit?.action, audit?.meta);
  if (!audit) throw new Error('Audit log missing');

  console.log('=== WORKFLOW ÉTAPE 9 VALIDÉ AVEC SUCCÈS ===');
}

main().catch((err) => {
  console.error('Error in workflow test:', err);
  process.exit(1);
});

