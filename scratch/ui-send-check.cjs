const fs = require('fs');
const { chromium } = require('@playwright/test');
const env = {};
for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const i = l.indexOf('='); if (i > 0 && !l.startsWith('#')) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); }
const phone = env.ADMIN_PHONE.split(',')[0].trim().replace(/^\+237/, '');
const BASE = 'http://localhost:3000';
const MODE = process.argv[2] || 'setup';
const DOC_ID = process.argv[3];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('CONSOLE', m.type(), m.text().slice(0, 300)); });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message.split('\n')[0]));
  page.on('request', (r) => { if (/send-email|send-whatsapp|mark-sent/.test(r.url())) console.log('REQ', r.method(), r.url().split('/api')[1]); });
  await page.goto(BASE + '/fr/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(2000);
  await page.locator('input[name="phone"]').click();
  await page.keyboard.type(phone, { delay: 30 });
  await page.getByText('Essentiels uniquement').click({ timeout: 5000 }).catch(() => {});
  await page.locator('input[type="password"]').nth(0).click();
  await page.keyboard.type(env.ADMIN_PIN, { delay: 30 });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /se connecter/i }).click({ force: true, timeout: 10000 }).catch(() => {});
  await page.waitForURL(/\/fr\/admin/, { timeout: 60000 });

  if (MODE === 'cleanup') {
    console.log('delete doc:', (await ctx.request.delete(BASE + `/api/documents/${DOC_ID}`, { headers: { 'X-Requested-With': 'fetch' } })).status());
    const me = await (await ctx.request.get(BASE + '/api/auth/me')).json();
    if (me.user?.proUntil) {
      const t = await ctx.request.post(BASE + '/api/admin/toggle-pro-test', { headers: { 'X-Requested-With': 'fetch' } });
      console.log('toggle pro (revert):', t.status());
    }
    await browser.close();
    return;
  }

  const me = await (await ctx.request.get(BASE + '/api/auth/me')).json();
  if (!me.user?.proUntil || new Date(me.user.proUntil) <= new Date()) {
    await ctx.request.post(BASE + '/api/admin/toggle-pro-test', { headers: { 'X-Requested-With': 'fetch' } });
  }
  const created = await (await ctx.request.post(BASE + '/api/documents', {
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    data: { type: 'FACTURE', locale: 'FR', clientId: null,
      payload: { lines: [{ description: 'TEST send page', quantity: 1, unitPrice: 1000 }], vatRate: 0 } },
  })).json();
  console.log('DOC_ID=' + created.documentId);

  await page.goto(BASE + (process.env.PAGE_PATH ? process.env.PAGE_PATH.replace('{id}', created.documentId) : `/fr/documents/${created.documentId}/envoyer`), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(9000);
  console.log('ISSUE-BADGE:', await page.locator('nextjs-portal').count());
  await page.screenshot({ path: 'scratch/s1-send-page.png', fullPage: true });

  // Email invalide -> erreur inline, aucune requête envoyée
  await page.getByRole('radio', { name: /email/i }).click();
  await page.locator('input[type="email"]').fill('pas-un-email');
  await page.getByRole('button', { name: /envoyer par email/i }).click();
  await page.waitForTimeout(800);
  console.log('email error shown:', await page.getByRole('alert').isVisible().catch(() => false));
  await page.screenshot({ path: 'scratch/s2-email-error.png', fullPage: true });

  // Téléchargement (sans envoi externe) -> écran de confirmation
  await page.getByRole('radio', { name: /télécharger/i }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }).catch(() => null),
    page.getByRole('button', { name: /télécharger le pdf/i }).click(),
  ]);
  console.log('download fired:', !!download, download ? download.suggestedFilename() : '');
  const t0 = Date.now();
  await page.getByRole('heading', { name: /téléchargé/i }).waitFor({ timeout: 40000 }).then(() => console.log('confirmation after', Date.now() - t0, 'ms')).catch(() => console.log('confirmation NOT shown after 40s'));
  await page.screenshot({ path: 'scratch/s3-confirmation.png', fullPage: true });
  await browser.close();
})().catch((e) => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
