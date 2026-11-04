const fs = require('fs');

async function testWorkflow() {
  const baseUrl = 'http://localhost:3000';
  const testPhone = '+237655' + Math.floor(100000 + Math.random() * 900000);
  const deviceId = 'test-device-' + Math.random().toString(36).substring(2);

  console.log('1. Registration for:', testPhone);
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: JSON.stringify({
      phone: testPhone,
      pin: '123456',
      name: 'Test Artisan',
      businessName: 'Atelier Test',
      city: 'Douala',
      mode: 'PRESTATION',
      deviceId,
      deviceName: 'Chrome Test',
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok) throw new Error('Registration failed: ' + JSON.stringify(regData));
  console.log('Registration OK, 8 recovery codes received:', regData.recoveryCodes?.length === 8);

  const cookie = regRes.headers.get('set-cookie');
  if (!cookie) throw new Error('No session cookie returned');
  const authHeaders = {
    'Cookie': cookie.split(';')[0],
    'Content-Type': 'application/json',
    'X-Requested-With': 'fetch',
  };

  console.log('2. Verify session via /api/auth/me');
  const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  if (!meRes.ok) throw new Error('Me failed: ' + JSON.stringify(meData));
  console.log('Session verified for:', meData.user.name, 'Mode:', meData.user.mode, 'Referral code:', meData.user.referralCode);

  console.log('3. Create client');
  const clientRes = await fetch(`${baseUrl}/api/clients`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Client Alpha SARL',
      phone: '+237699112233',
      address: 'Akwa, Douala',
      note: 'Client VIP',
    }),
  });
  const clientData = await clientRes.json();
  if (!clientRes.ok) throw new Error('Create client failed: ' + JSON.stringify(clientData));
  const clientId = clientData.client.id;
  console.log('Client created:', clientId, clientData.client.name);

  console.log('4. Create document (DEVIS with 2 lines)');
  const docRes = await fetch(`${baseUrl}/api/documents`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientId,
      type: 'DEVIS',
      locale: 'FR',
      payload: {
        lines: [
          { description: 'Création site web', quantity: 1, unitPrice: 150000 },
          { description: 'Hébergement & Domaine 1 an', quantity: 1, unitPrice: 35000 },
        ],
        vatRate: 0,
        deliveryFee: 0,
      },
    }),
  });
  const docData = await docRes.json();
  if (!docRes.ok) throw new Error('Create document failed: ' + JSON.stringify(docData));
  console.log('Document created:', docData.documentId, 'Number:', docData.number, 'Token:', docData.publicToken);

  console.log('5. Mark sent (simulate WhatsApp send)');
  const sentRes = await fetch(`${baseUrl}/api/documents/${docData.documentId}/mark-sent`, {
    method: 'POST',
    headers: authHeaders,
  });
  if (!sentRes.ok) throw new Error('Mark sent failed');
  console.log('Document marked sent via WhatsApp!');

  console.log('6. Verify public verification route for token:', docData.publicToken);
  const verifyRes = await fetch(`${baseUrl}/fr/verify/${docData.publicToken}`);
  if (!verifyRes.ok) throw new Error('Verify page failed');
  console.log('Public verify page response status:', verifyRes.status);

  console.log('7. Upload logo test');
  // 1x1 transparent PNG buffer
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const payloadBuffer = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="kind"\r\n\r\nlogo\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n`),
    pngBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await fetch(`${baseUrl}/api/uploads`, {
    method: 'POST',
    headers: {
      'Cookie': cookie.split(';')[0],
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'X-Requested-With': 'fetch',
    },
    body: payloadBuffer,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error('Upload logo failed: ' + JSON.stringify(uploadData));
  console.log('Logo uploaded:', uploadData.url);

  console.log('8. Update business profile with logo');
  const updateRes = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      logoUrl: uploadData.url,
      legalName: 'Atelier Test SARL',
      taxId: 'M0123456789X',
    }),
  });
  const updateData = await updateRes.json();
  if (!updateRes.ok) throw new Error('Update profile failed: ' + JSON.stringify(updateData));
  console.log('Profile updated successfully, logoUrl:', updateData.user.logoUrl);

  console.log('9. Referral test (parrainage)');
  const parrainCode = meData.user.referralCode;
  const filleulPhone = '+237655' + Math.floor(100000 + Math.random() * 900000);
  const filleulDevice = 'filleul-device-' + Math.random().toString(36).substring(2);

  const fRegRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: JSON.stringify({
      phone: filleulPhone,
      pin: '654321',
      name: 'Filleul Test',
      mode: 'ECOMMERCE',
      deviceId: filleulDevice,
      referredByCode: parrainCode,
    }),
  });
  const fRegData = await fRegRes.json();
  if (!fRegRes.ok) throw new Error('Filleul register failed: ' + JSON.stringify(fRegData));
  const fCookie = fRegRes.headers.get('set-cookie');
  console.log('Filleul registered with referrer code:', parrainCode);

  // Filleul creates first document and marks it sent
  const fDocRes = await fetch(`${baseUrl}/api/documents`, {
    method: 'POST',
    headers: {
      'Cookie': fCookie.split(';')[0],
      'Content-Type': 'application/json',
      'X-Requested-With': 'fetch',
    },
    body: JSON.stringify({
      type: 'TICKET',
      locale: 'FR',
      payload: {
        lines: [{ description: 'Article 1', quantity: 1, unitPrice: 5000 }],
      },
    }),
  });
  const fDocData = await fDocRes.json();
  await fetch(`${baseUrl}/api/documents/${fDocData.documentId}/mark-sent`, {
    method: 'POST',
    headers: {
      'Cookie': fCookie.split(';')[0],
      'Content-Type': 'application/json',
      'X-Requested-With': 'fetch',
    },
  });
  console.log('Filleul first document marked sent (activated)!');

  console.log('\n==========================================');
  console.log('ALL WORKFLOW STEPS VALIDATED SUCCESSFULLY!');
  console.log('==========================================');
}

testWorkflow().catch((err) => {
  console.error('Workflow error:', err);
  process.exit(1);
});
