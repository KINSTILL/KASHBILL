const fs = require('fs');
const { chromium } = require('@playwright/test');
const env = {};
for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const i = l.indexOf('='); if (i > 0 && !l.startsWith('#')) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); }
const phone = env.ADMIN_PHONE.split(',')[0].trim().replace(/^\+237/, '');
const BASE = 'http://localhost:3000';
const docId = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message.split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE error:', m.text().slice(0, 200)); });
  page.on('request', (r) => { if (r.url().includes('/api/documents/')) console.log('REQ', r.method(), r.url().split('/api')[1]); });
  page.on('popup', () => console.log('POPUP opened'));

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

  await page.goto(BASE + `/fr/documents/${docId}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  await page.getByRole('button', { name: /^Envoyer$/ }).first().click({ timeout: 15000 });
  await page.waitForTimeout(1500);
  console.log('--- clicking "Envoyer par email" ---');
  await page.getByRole('button', { name: /par email/i }).first().click({ timeout: 10000 });
  await page.waitForTimeout(3000);
  const probe = await page.evaluate(() => ({
    h2: [...document.querySelectorAll('h2')].map((h) => h.textContent),
    emailInput: !!document.querySelector('input[type=email]'),
    dialogs: document.querySelectorAll('[role=dialog]').length,
    overlays: document.querySelectorAll('.sheet-backdrop').length,
  }));
  console.log('probe:', JSON.stringify(probe));
  await page.screenshot({ path: 'scratch/r4-after-email-click.png' });
  await browser.close();
})().catch((e) => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
