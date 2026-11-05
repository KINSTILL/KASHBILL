const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let failures = 0;

function check(name, expected, actual) {
  if (String(expected) === String(actual)) {
    console.log(`✅ ${name} → ${actual}`);
  } else {
    console.log(`❌ ${name} → attendu ${expected}, reçu ${actual}`);
    failures++;
  }
}

async function runAudit() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('AUDIT SÉCURITÉ CASHBILL');
  console.log('═══════════════════════════════════════════════════════════');

  // 1. CSRF : mutation sans X-Requested-With → 403
  try {
    const res1 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '699000000', pin: '123456', deviceId: 'x', locale: 'FR' }),
    });
    check('CSRF sans header', 403, res1.status);
  } catch (e) {
    check('CSRF sans header', 403, e.message);
  }

  // 2. Rate limit login : 11 tentatives → la 11e = 429
  let lastStatus = 0;
  for (let i = 0; i < 11; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ phone: '699000099', pin: '999999', deviceId: 'x' }),
      });
      lastStatus = res.status;
    } catch (e) {
      lastStatus = 500;
    }
  }
  check('Rate limit login', 429, lastStatus);

  // 3. Headers sécurité
  try {
    const res3 = await fetch(`${BASE_URL}/fr`);
    const xFrame = res3.headers.get('x-frame-options');
    check('X-Frame-Options', 'DENY', xFrame);

    const xContent = res3.headers.get('x-content-type-options');
    check('X-Content-Type-Options', 'nosniff', xContent);

    const csp = res3.headers.get('content-security-policy') || '';
    if (csp.includes("default-src 'self'")) {
      console.log('✅ Content-Security-Policy présent');
    } else {
      console.log('❌ Content-Security-Policy manquant ou invalide');
      failures++;
    }
  } catch (e) {
    check('Headers sécurité', 'ok', e.message);
  }

  // 4. Auth bypass : /api/auth/me sans cookie → 401
  try {
    const res4 = await fetch(`${BASE_URL}/api/auth/me`);
    check('Auth bypass /api/auth/me', 401, res4.status);
  } catch (e) {
    check('Auth bypass /api/auth/me', 401, e.message);
  }

  // 5. Auth bypass : /api/admin/users sans cookie → 401
  try {
    const res5 = await fetch(`${BASE_URL}/api/admin/users`);
    check('Auth bypass /api/admin/users', 401, res5.status);
  } catch (e) {
    check('Auth bypass /api/admin/users', 401, e.message);
  }

  // 6. Webhook signature invalide → 401
  try {
    const res6 = await fetch(`${BASE_URL}/api/webhooks/notchpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Notchpay-Signature': 'invalid',
      },
      body: JSON.stringify({ event: 'payment.complete', data: { reference: 'x' } }),
    });
    check('Webhook signature invalide', 401, res6.status);
  } catch (e) {
    check('Webhook signature invalide', 401, e.message);
  }

  // 7. Directory traversal uploads
  try {
    const res7 = await fetch(`${BASE_URL}/api/uploads/..%2F..%2Fetc%2Fpasswd`);
    check('Directory traversal uploads', 401, res7.status);
  } catch (e) {
    check('Directory traversal uploads', 401, e.message);
  }

  // 8. Health endpoint
  try {
    const res8 = await fetch(`${BASE_URL}/api/health`);
    check('Health check', 200, res8.status);
  } catch (e) {
    check('Health check', 200, e.message);
  }

  console.log('═══════════════════════════════════════════════════════════');
  if (failures === 0) {
    console.log('✅ AUDIT SÉCURITÉ : TOUS LES TESTS PASSENT');
    process.exit(0);
  } else {
    console.log(`❌ AUDIT SÉCURITÉ : ${failures} ÉCHEC(S)`);
    process.exit(1);
  }
}

runAudit();

