import { test, expect, registerUser } from './fixtures';

test.describe('Paiement + Parrainage', () => {
  test('parrainage complet', async ({ page, browser }) => {
    // Parrain (user1)
    const _parrain = await registerUser(page);
    await page.goto('/fr/referrals');
    const code = await page.locator('p.font-mono').first().textContent();
    expect(code).toBeTruthy();

    // Filleul (user2, nouveau contexte)
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    const _filleul = await registerUser(page2, { referralCode: code?.trim() });

    // Le filleul crée et envoie un document
    await page2.goto('/fr/documents/new');
    await page2.fill('input[name="description-0"]', 'Test parrainage');
    await page2.fill('input[name="unitPrice-0"]', '1000');
    await page2.click('button:has-text("Générer le document")');
    await page2.waitForURL(/\/documents\/(?!new)[^/]+/);
    const envoyerBtn = page2.locator('button:has-text("Envoyer")');
    await envoyerBtn.waitFor({ state: 'visible', timeout: 30_000 });
    await envoyerBtn.click();
    const markSentPromise = page2.waitForResponse((r) => r.url().includes('mark-sent') && r.status() === 200);
    await page2.click('button:has-text("Télécharger le PDF")');
    await markSentPromise;

    // Le parrain doit voir +7 jours
    await page.goto('/fr/dashboard');
    // Vérifier via l'API que proUntil a été mis à jour
    const res = await page.request.get('/api/auth/me');
    const me = await res.json();
    expect(new Date(me.user.proUntil).getTime()).toBeGreaterThan(Date.now() + 5 * 24 * 60 * 60 * 1000);

    await ctx2.close();
  });

  test('page upgrade charge et boutons présents', async ({ page, user: _user }) => {
    await page.goto('/fr/upgrade');
    await expect(page.getByText(/Passer Pro/i)).toBeVisible();
    await expect(page.getByText(/2 000 FCFA \/ 30 jours/i)).toBeVisible();
    await expect(page.locator('button:has-text("Orange Money")')).toBeVisible();
    await expect(page.locator('button:has-text("MTN MoMo")')).toBeVisible();
  });
});

