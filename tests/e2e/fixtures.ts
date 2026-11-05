import { test as base, expect, type Page } from '@playwright/test';

let counter = Math.floor(Math.random() * 1000);
function uniquePhone(): string {
  counter = (counter + 1) % 9000;
  const rand = Math.floor(10 + Math.random() * 90);
  return `699${rand}${String(counter).padStart(4, '0')}`;
}

export type TestUser = {
  phone: string;
  pin: string;
  deviceId: string;
  cookie: string;
};

async function registerUser(
  page: Page,
  options?: { pin?: string; useTrial?: boolean; referralCode?: string }
): Promise<TestUser> {
  const phone = uniquePhone();
  const pin = options?.pin ?? '123456';
  const deviceId = crypto.randomUUID();

  const currentUrl = page.url();
  if (!currentUrl.includes('/register')) {
    const target = options?.referralCode ? `/fr/register?ref=${options.referralCode}` : '/fr/register';
    await page.goto(target);
    await page.waitForLoadState('networkidle');
  }
  await page.locator('input[name="phone"]').fill(phone);
  await page.locator('input[name="pin"]').fill(pin);
  await page.locator('input[name="confirmPin"]').fill(pin);
  await page.locator('input[name="name"]').fill('Test User');
  await page.locator('input[name="acceptTerms"]').check();

  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5000 }).catch(async () => {
    // If hydration reset inputs, refill
    await page.locator('input[name="phone"]').fill(phone);
    await page.locator('input[name="pin"]').fill(pin);
    await page.locator('input[name="confirmPin"]').fill(pin);
    await page.locator('input[name="name"]').fill('Test User');
    await page.locator('input[name="acceptTerms"]').check();
  });

  await page.click('button[type="submit"]');

  // Attendre l'apparition des codes de récupération
  await expect(page.getByText(/codes de récupération/i)).toBeVisible({ timeout: 15_000 });
  await page.click('button:has-text("J\'ai sauvegardé")');

  await page.waitForURL('**/dashboard');

  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find((c) => c.name === 'cashbill_session');
  return { phone, pin, deviceId, cookie: sessionCookie?.value ?? '' };
}

export const test = base.extend<{ user: TestUser }>({
  user: async ({ page }, use) => {
    const u = await registerUser(page);
    await use(u);
  },
});

export { expect, registerUser };
