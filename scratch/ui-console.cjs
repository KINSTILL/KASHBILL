const fs = require('fs');
const { chromium } = require('@playwright/test');
const env = {};
for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const i = l.indexOf('='); if (i > 0 && !l.startsWith('#')) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); }
const phone = env.ADMIN_PHONE.split(',')[0].trim().replace(/^\+237/, '');
const BASE = 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 90)); });
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
  for (const path of process.argv.slice(2)) {
    errors.length = 0;
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(7000);
    console.log(path, '-> errors:', errors.length, errors[0] ?? '', '| badge:', await page.locator('nextjs-portal').count());
  }
  await browser.close();
})().catch((e) => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
