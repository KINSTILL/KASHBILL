import { test, expect, registerUser } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  '/fr/login',
  '/fr/register',
  '/fr/recovery',
  '/fr/dashboard',
  '/fr/documents/new',
  '/fr/clients',
  '/fr/settings',
  '/fr/upgrade',
  '/fr/referrals',
];

test.describe('Accessibilité WCAG AA', () => {
  for (const path of pages) {
    test(`${path} sans violations critiques`, async ({ page, browser }) => {
      let targetPage = page;
      let ctx = null;
      if (['/fr/login', '/fr/register', '/fr/recovery'].includes(path)) {
        ctx = await browser.newContext();
        targetPage = await ctx.newPage();
      } else {
        await registerUser(page);
        targetPage = page;
      }

      await targetPage.goto(path);
      const results = await new AxeBuilder({ page: targetPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      if (critical.length > 0) {
        console.error(`Violations sur ${path}:`, critical.map((v) => ({ id: v.id, nodes: v.nodes.length })));
      }
      expect(critical).toHaveLength(0);

      if (ctx) {
        await ctx.close();
      }
    });
  }
});

