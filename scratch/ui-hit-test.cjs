const fs = require('fs');
const { chromium } = require('@playwright/test');
const env = {};
for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) { const i = l.indexOf('='); if (i > 0 && !l.startsWith('#')) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); }
const phone = env.ADMIN_PHONE.split(',')[0].trim().replace(/^\+237/, '');
const BASE = 'http://localhost:3000';
const MODE = process.argv[2] || 'setup'; // setup | cleanup
const DOC_ID = process.argv[3];

// Probe : pour chaque point cliqué dans la modale, quel élément reçoit réellement le clic ?
const PROBE = () => {
  const inside = (el) => !!el.closest('[data-vaul-drawer], [role=dialog]');
  const describe = (el) => el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).slice(0, 60)} "${(el.textContent || '').trim().slice(0, 30)}"` : 'null';
  const modalButtons = [...document.querySelectorAll('[data-vaul-drawer] button, [role=dialog] button, [data-vaul-drawer] input, [role=dialog] input, [data-vaul-drawer] textarea')].slice(0, 8);
  const hits = modalButtons.map((b) => {
    const r = b.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return { target: describe(b), hitTop: describe(top), hitIsInsideModal: top ? inside(top) : false, visible: r.width > 0 && r.height > 0 };
  });
  const bodyStyle = getComputedStyle(document.body);
  const drawers = [...document.querySelectorAll('[data-vaul-drawer]')].map((d) => ({
    state: d.getAttribute('data-state'),
    pe: getComputedStyle(d).pointerEvents,
    z: getComputedStyle(d).zIndex,
  }));
  const overlays = [...document.querySelectorAll('[data-vaul-overlay], .sheet-backdrop, .fixed.inset-0')].map((o) => ({
    cls: String(o.className).slice(0, 50),
    z: getComputedStyle(o).zIndex,
    pe: getComputedStyle(o).pointerEvents,
  }));
  return {
    bodyPointerEvents: bodyStyle.pointerEvents,
    bodyOverflow: bodyStyle.overflow,
    drawers,
    overlays,
    hits,
  };
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('request', (r) => { if (r.url().includes('/api/documents/') && r.method()==='POST') console.log('REQ', r.method(), r.url().split('/api')[1]); });
  page.on('framenavigated', (f) => { if (f === page.mainFrame() && f.url().includes('mailto')) console.log('MAILTO nav'); });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message.split('\n')[0]));

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
    const t = await ctx.request.post(BASE + '/api/admin/toggle-pro-test', { headers: { 'X-Requested-With': 'fetch' } });
    console.log('toggle pro:', t.status(), (await t.text()).slice(0, 120));
    await browser.close();
    return;
  }

  // Setup : Pro actif + document de test
  const me = await (await ctx.request.get(BASE + '/api/auth/me')).json();
  if (!(me.user?.proUntil && new Date(me.user.proUntil) > new Date())) {
    await ctx.request.post(BASE + '/api/admin/toggle-pro-test', { headers: { 'X-Requested-With': 'fetch' } });
  }
  console.log('me.proUntil:', me.user?.proUntil ?? null);
  const docRes = await ctx.request.post(BASE + '/api/documents', {
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    data: { type: 'FACTURE', locale: 'FR', clientId: null,
      payload: { lines: [{ description: 'TEST hit-test', quantity: 1, unitPrice: 1000 }], vatRate: 0 } },
  });
  const created = await docRes.json();
  console.log('DOC_ID=' + created.documentId);

  await page.goto(BASE + `/fr/documents/${created.documentId}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  await page.getByRole('button', { name: /^Envoyer$/ }).first().click({ timeout: 15000 });
  await page.waitForTimeout(1500);
  console.log('--- ShareSheet ouverte ---');
  console.log(JSON.stringify(await page.evaluate(PROBE), null, 1));
  await page.screenshot({ path: 'scratch/h1-sharesheet.png' });

  await page.getByRole('button', { name: /par email/i }).first().click({ timeout: 10000 });
  await page.waitForTimeout(3000);
  console.log('--- EmailSendSheet ouverte ---');
  console.log(JSON.stringify(await page.evaluate(PROBE), null, 1));
  await page.screenshot({ path: 'scratch/h2-emailsheet.png' });
  await browser.close();
})().catch((e) => { console.error('ERR', e.message.split('\n')[0]); process.exit(1); });
