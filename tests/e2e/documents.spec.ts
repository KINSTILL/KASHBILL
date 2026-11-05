import { test, expect } from './fixtures';

test.describe('Documents', () => {
  test('création client → devis → ShareSheet → WhatsApp', async ({ page, user: _user }) => {
    // Créer un client
    await page.goto('/fr/clients/new');
    await page.fill('input[name="name"]', 'Jean Dupont');
    await page.fill('input[name="phone"]', '699888777');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/clients');

    // Créer un devis
    await page.locator('button:has-text("Nouveau"):visible').click();
    await page.selectOption('select[name="type"]', 'DEVIS');
    await page.selectOption('select[name="clientId"]', { label: 'Jean Dupont' });

    // 2 lignes
    await page.fill('input[name="description-0"]', 'Confection robe');
    await page.fill('input[name="quantity-0"]', '2');
    await page.fill('input[name="unitPrice-0"]', '25000');
    await page.click('button:has-text("Ajouter une ligne")');
    await page.fill('input[name="description-1"]', 'Retouche');
    await page.fill('input[name="quantity-1"]', '1');
    await page.fill('input[name="unitPrice-1"]', '5000');

    // Total = 55000
    await expect(page.getByText('55 000 FCFA')).toBeVisible();

    // Format par défaut = A4 pour devis
    await expect(page.locator('button:has-text("A4 Pro")')).toHaveClass(/bg-sage-(500|700)/);

    await page.click('button:has-text("Générer le document")');
    await page.waitForURL(/\/fr\/documents\/(?!new)[^/]+/);

    // Aperçu PDF
    await expect(page.locator('object[type="application/pdf"]')).toBeVisible({ timeout: 20_000 });

    // Ouvrir ShareSheet
    await page.click('button:has-text("Envoyer")');
    await expect(page.getByText('Envoyer le document')).toBeVisible();
    await page.waitForTimeout(600);

    // Changer le ton
    await page.getByRole('button', { name: 'Pratique' }).click();
    const textarea = page.locator('textarea');
    await expect(textarea).toContainText(/Hello ! Voici le brouillon/i);

    // Changer Tu/Vous
    await page.getByRole('button', { name: 'Vous' }).click();
    await expect(textarea).toContainText(/Vérifiez/i);

    // Éditer manuellement
    await textarea.fill('Message personnalisé pour Jean');
    await expect(page.getByText('Personnalisé', { exact: true })).toBeVisible();

    // Télécharger le PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Télécharger le PDF")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^MCB-\d{4}-\d{6}\.pdf$/);

    // Vérifier taille du PDF < 100 Ko
    const path = await download.path();
    const fs = await import('node:fs');
    const stats = fs.statSync(path!);
    expect(stats.size).toBeLessThan(100 * 1024);
  });

  test('auto-save brouillon + reprise', async ({ page, user: _user }) => {
    await page.goto('/fr/documents/new');
    await page.fill('input[name="description-0"]', 'Test brouillon');
    await page.fill('input[name="unitPrice-0"]', '12345');
    // Attendre l'auto-save (2s debounce)
    await page.waitForTimeout(2500);
    await expect(page.getByText(/Brouillon sauvegardé/i)).toBeVisible();

    // Recharger la page
    await page.reload();

    // Doit proposer la reprise
    await expect(page.getByText(/Reprendre le brouillon/i)).toBeVisible();
    await page.click('button:has-text("Reprendre")');
    await expect(page.locator('input[name="description-0"]')).toHaveValue('Test brouillon');
    await expect(page.locator('input[name="unitPrice-0"]')).toHaveValue('12345');
  });

  test('limite 3 clients en gratuit', async ({ page, user: _user }) => {
    const { prisma } = await import('@/lib/db');
    const phone = _user.phone.startsWith('+237') ? _user.phone : `+237${_user.phone}`;
    await prisma.user.update({
      where: { phone },
      data: { proUntil: null },
    });
    for (let i = 0; i < 3; i++) {
      await page.goto('/fr/clients/new');
      await page.fill('input[name="name"]', `Client ${i}`);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/clients');
    }
    await page.goto('/fr/clients/new');
    await page.fill('input[name="name"]', 'Client 4');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/Limite gratuite atteinte/i)).toBeVisible();
  });

  test('sélecteur de format Ticket vs A4', async ({ page, user: _user }) => {
    await page.goto('/fr/documents/new');
    await page.selectOption('select[name="type"]', 'RECU');
    // Format par défaut = Ticket pour RECU
    await expect(page.locator('button:has-text("Ticket 80mm")')).toHaveClass(/bg-sage-(500|700)/);
    // Override manuel vers A4
    await page.click('button:has-text("A4 Pro")');
    await expect(page.locator('button:has-text("A4 Pro")')).toHaveClass(/bg-sage-(500|700)/);
  });
});

