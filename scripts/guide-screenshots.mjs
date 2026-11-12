// Capture les écrans de MyCashBill pour le mode d'emploi (docs/MODE-D-EMPLOI.md).
// Usage : node scripts/guide-screenshots.mjs   (serveur de dev sur http://localhost:3000)
// Crée un compte de démonstration dans la base locale (.env.local).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = path.resolve('docs/captures');
const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };
const PIN = '482913';
const demoPhone = `69${Math.floor(1000000 + Math.random() * 8999999)}`;
const deviceId = `guide-${Date.now()}`;

fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[guide]', ...a);

async function shot(page, name, opts = {}) {
  await page.waitForTimeout(700);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false, ...opts });
  log('capture', name);
}

async function go(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
}

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    log(`ÉCHEC ${name} :`, e.message.split('\n')[0]);
  }
}

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: DESKTOP, locale: 'fr-FR' });
const page = await desktop.newPage();

// 1. Pages publiques (avant inscription)
await step('accueil', async () => {
  await go(page, '/fr');
  await shot(page, '01-accueil-ordinateur');
});
await step('connexion', async () => {
  await go(page, '/fr/login');
  await shot(page, '02-connexion-ordinateur');
});
await step('inscription', async () => {
  await go(page, '/fr/register');
  await shot(page, '03-inscription-ordinateur');
});

// 2. Création du compte (via l'API d'inscription, puis session dans le navigateur)
await step('compte', async () => {
  const res = await page.request.post(`${BASE}/api/auth/register`, {
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    data: {
      phone: demoPhone,
      pin: PIN,
      name: 'Marie Ngono',
      businessName: 'Boutique Akwa',
      city: 'Douala',
      mode: 'PRESTATION',
      locale: 'FR',
      deviceId,
      deviceName: 'Ordinateur de démonstration',
      acceptTerms: true,
      accountType: 'PROFESSIONAL',
    },
  });
  log('inscription API :', res.status());
  if (!res.ok()) throw new Error(`inscription refusée (${res.status()}) ${await res.text()}`);
});

// 3. Tableau de bord, puis profil entreprise
await step('tableau de bord', async () => {
  await go(page, '/fr/dashboard');
  await shot(page, '04-tableau-de-bord-ordinateur');
});

await step('profil entreprise', async () => {
  await go(page, '/fr/settings/business');
  await page.locator('#businessName').fill('Boutique Akwa');
  await page.locator('#legalName').fill('Boutique Akwa SARL');
  await page.locator('#taxId').fill('M052300012345Z');
  await page.locator('#rccm').fill('RC/DLA/2024/B/123');
  await page.locator('#legalAddress').fill('Akwa, BP 1234 Douala');
  await shot(page, '05-profil-entreprise-ordinateur');
});

// 4. Clients (créés via l'API pour aller vite)
await step('clients', async () => {
  for (const c of [
    { name: 'Jean Kamga', phone: '+237677000111', address: 'Bonanjo, Douala' },
    { name: 'Société Nkongsamba Import', phone: '+237699000222', taxId: 'P0987654321' },
  ]) {
    await page.request.post(`${BASE}/api/clients`, {
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
      data: c,
    });
  }
  await go(page, '/fr/clients');
  await shot(page, '06-clients-ordinateur');
});

// 5. Création d'une facture, pas à pas
await step('nouveau document', async () => {
  await go(page, '/fr/documents/new');
  await shot(page, '07-nouveau-document-ordinateur');
  await page.getByRole('button', { name: /^FACTURE(?! PROFORMA)/ }).first().click();
  await page.waitForTimeout(500);
  await shot(page, '08-choix-type-facture-ordinateur');
});

await step('remplir la facture', async () => {
  await page.getByPlaceholder(/Développement site web|Désignation/).first().fill('Lot de 10 chemises en lin');
  await page.locator('input[type="number"]').nth(0).fill('10');
  await page.locator('input[type="number"]').nth(1).fill('8500');
  await shot(page, '09-lignes-facture-ordinateur');
});

await step('générer la facture', async () => {
  await page.getByRole('button', { name: /Générer le document/ }).click();
  await page.waitForURL(/\/documents\/[a-z0-9]+$/, { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await shot(page, '10-apercu-document-ordinateur');
});

// 6. Historique, programmation, abonnement
await step('historique', async () => {
  await go(page, '/fr/documents');
  await shot(page, '11-historique-ordinateur');
});
await step('parrainage', async () => {
  await go(page, '/fr/referrals');
  await shot(page, '12-parrainage-ordinateur');
});
await step('passer pro', async () => {
  await go(page, '/fr/upgrade');
  await shot(page, '13-passer-pro-ordinateur');
});
await step('appareils', async () => {
  await go(page, '/fr/devices');
  await shot(page, '14-appareils-ordinateur');
});

// 7. Version téléphone (même session)
const state = await desktop.storageState();
const mobileCtx = await browser.newContext({
  viewport: PHONE,
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
  locale: 'fr-FR',
  storageState: state,
});
const phone = await mobileCtx.newPage();
await step('mobile tableau de bord', async () => {
  await go(phone, '/fr/dashboard');
  await shot(phone, '20-tableau-de-bord-telephone');
});
await step('mobile nouveau document', async () => {
  await go(phone, '/fr/documents/new');
  await shot(phone, '21-nouveau-document-telephone');
});
await step('mobile historique', async () => {
  await go(phone, '/fr/documents');
  await shot(phone, '22-historique-telephone');
});
await step('mobile clients', async () => {
  await go(phone, '/fr/clients');
  await shot(phone, '23-clients-telephone');
});
await step('mobile profil', async () => {
  await go(phone, '/fr/settings');
  await shot(phone, '24-profil-telephone');
});
await step('mobile accueil', async () => {
  const anon = await browser.newContext({ viewport: PHONE, isMobile: true, hasTouch: true, deviceScaleFactor: 2, locale: 'fr-FR' });
  const p = await anon.newPage();
  await go(p, '/fr');
  await shot(p, '25-accueil-telephone');
  await anon.close();
});

await browser.close();
log('terminé. Demo phone :', demoPhone);
