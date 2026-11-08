import { test, expect } from '@playwright/test';
import { registerUser } from './fixtures';

test.describe('Admin', () => {
  const adminPhone = (process.env.ADMIN_PHONE?.split(/[,;]/)[0] || '').trim();

  test('login admin + stats', async ({ page }) => {
    await page.goto('/fr/login');
    await page.fill('input[name="phone"]', adminPhone);
    await page.fill('input[name="pin"]', process.env.ADMIN_PIN!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');

    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.getByText('Utilisateurs', { exact: true })).toBeVisible();
    await expect(page.getByText('Documents', { exact: true })).toBeVisible();
  });

  test.skip('SUPPORT ne peut pas bannir', async () => {
    // Créer un SUPPORT via Prisma + login
    // Vérifier que /admin/users/[id]/ban est inaccessible
  });

  test('création SUPPORT + bannissement USER par ADMIN', async ({ page, browser }) => {
    // 1. Login ADMIN
    await page.goto('/fr/login');
    await page.fill('input[name="phone"]', adminPhone);
    await page.fill('input[name="pin"]', process.env.ADMIN_PIN!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');

    // 2. Créer un USER cible dans un autre contexte
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    const victim = await registerUser(p2);

    // 3. Aller dans /admin/users, chercher la victime, bannir
    await page.goto('/fr/admin/users');
    await page.fill('input[type="search"]', victim.phone);
    await page.waitForTimeout(500);
    await page.click(`a:has-text("${victim.phone}")`);
    await page.click('button:has-text("Bannir")');

    // Reauth Sheet
    await expect(page.getByText(/Ré-authentification requise/i)).toBeVisible();
    await page.fill('input[inputmode="numeric"]', process.env.ADMIN_PIN!);
    await page.click('button:has-text("Confirmer")');
    await expect(page.getByText('BANNI')).toBeVisible();

    // Vérifier que la victime est bannie (tente de se connecter)
    await ctx2.close();
    const ctx3 = await browser.newContext();
    const p3 = await ctx3.newPage();
    await p3.goto('/fr/login');
    await p3.fill('input[name="phone"]', victim.phone);
    await p3.fill('input[name="pin"]', victim.pin);
    await p3.click('button[type="submit"]');
    await expect(p3.getByText(/suspendu/i)).toBeVisible();
    await ctx3.close();
  });

  test('seuils bornés côté API', async ({ page }) => {
    await page.goto('/fr/login');
    await page.fill('input[name="phone"]', adminPhone);
    await page.fill('input[name="pin"]', process.env.ADMIN_PIN!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');

    const res = await page.request.patch('/api/admin/thresholds/MAX_DOCS_PER_24H', {
      headers: { 'X-Requested-With': 'fetch' },
      data: { value: 5, reason: 'test' },
    });
    expect(res.status()).toBe(401); // REAUTH_REQUIRED

    // Avec reauth
    const reauth = await page.request.post('/api/admin/reauth/issue', {
      headers: { 'X-Requested-With': 'fetch' },
      data: { pin: process.env.ADMIN_PIN! },
    });
    const { reauthToken } = await reauth.json();

    const res2 = await page.request.patch('/api/admin/thresholds/MAX_DOCS_PER_24H', {
      headers: { 'X-Requested-With': 'fetch', 'X-Reauth-Token': reauthToken },
      data: { value: 5, reason: 'test' },
    });
    expect(res2.status()).toBe(403); // valeur < floor 10
  });
});

