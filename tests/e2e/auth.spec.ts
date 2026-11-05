import { test, expect } from './fixtures';

test.describe('Auth', () => {
  test('inscription complète avec codes de récupération', async ({ page }) => {
    const phone = `699${Date.now().toString().slice(-6)}`;
    await page.goto('/fr/register');
    await page.fill('input[name="phone"]', phone);
    await page.fill('input[name="pin"]', '123456');
    await page.fill('input[name="confirmPin"]', '123456');
    await page.fill('input[name="name"]', 'Awa Bello');
    await page.fill('input[name="businessName"]', 'Awa Couture');
    await page.fill('input[name="city"]', 'Douala');
    await page.check('input[name="acceptTerms"]');
    await page.click('button[type="submit"]');

    // Codes de récupération
    await expect(page.getByText(/codes de récupération/i)).toBeVisible();
    const codes = await page.locator('code').allTextContents();
    expect(codes.length).toBe(8);
    codes.forEach((c) => expect(c).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/));

    await page.click('button:has-text("J\'ai sauvegardé")');
    await expect(page).toHaveURL(/\/fr\/dashboard/);
    await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible();
  });

  test('rejette un PIN invalide', async ({ page }) => {
    await page.goto('/fr/register');
    await page.fill('input[name="phone"]', '699999999');
    await page.fill('input[name="pin"]', '123'); // trop court
    await page.fill('input[name="confirmPin"]', '123');
    await page.check('input[name="acceptTerms"]');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('login sur device existant', async ({ browser, user }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto('/fr/login');
    await p.fill('input[name="phone"]', user.phone);
    await p.fill('input[name="pin"]', user.pin);
    await p.click('button[type="submit"]');
    await p.waitForURL('**/dashboard');
    await ctx.close();
  });

  test('device limit en gratuit', async ({ page, user }) => {
    // Expirer le Pro trial pour tester la limite gratuit (1 appareil)
    const { PrismaClient } = await import('@prisma/client');
    const dbUrl = (process.env.DATABASE_URL || '').includes('mycashbill_test')
      ? process.env.DATABASE_URL
      : 'postgresql://mycashbill:mycashbill@localhost:5433/mycashbill_test';
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    const normalizedPhone = user.phone.startsWith('+237') ? user.phone : `+237${user.phone}`;
    await prisma.user.update({
      where: { phone: normalizedPhone },
      data: { proUntil: null },
    });
    await prisma.$disconnect();

    // Se connecter depuis un nouveau contexte = nouveau device
    const newContext = await page.context().browser()!.newContext();
    const p2 = await newContext.newPage();
    await p2.goto('/fr/login');
    await p2.fill('input[name="phone"]', user.phone);
    await p2.fill('input[name="pin"]', user.pin);
    await p2.click('button[type="submit"]');

    // Doit afficher le Sheet DEVICE_LIMIT_REACHED
    await expect(p2.getByText(/limite d'appareils/i)).toBeVisible({ timeout: 20_000 });
    await newContext.close();
  });

  test('recovery flow', async ({ page }) => {
    const phone = `699${String(Date.now()).slice(-3)}${Math.floor(100 + Math.random() * 900)}`;
    // Créer un compte manuellement
    await page.goto('/fr/register');
    await page.fill('input[name="phone"]', phone);
    await page.fill('input[name="pin"]', '111111');
    await page.fill('input[name="confirmPin"]', '111111');
    await page.fill('input[name="name"]', 'Recovery Test');
    await page.check('input[name="acceptTerms"]');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/codes de récupération/i)).toBeVisible();
    const codes = await page.locator('code').allTextContents();
    const firstCode = codes[0]!;
    await page.click('button:has-text("J\'ai sauvegardé")');

    // Logout
    await page.goto('/fr/settings');
    await page.click('button:has-text("Déconnexion")');
    await page.waitForURL(/\/fr\/login/);

    // Recovery
    await page.click('a:has-text("PIN oublié")');
    await page.waitForURL(/\/fr\/recovery/);
    await page.fill('input[name="phone"]', phone);
    await page.fill('input[name="recoveryCode"]', firstCode);
    await page.fill('input[name="newPin"]', '999999');
    await page.fill('input[name="confirmPin"]', '999999');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Vérifier que le nouveau PIN fonctionne
    await page.goto('/fr/settings');
    await page.click('button:has-text("Déconnexion")');
    await page.waitForURL(/\/fr\/login/);
    await page.fill('input[name="phone"]', phone);
    await page.fill('input[name="pin"]', '999999');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });
});

