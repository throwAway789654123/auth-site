import { test, expect } from '@playwright/test';

/** Projet `anonymous` : contexte sans storageState. Tests négatifs. */
test('sans storageState, toute route protégée redirige vers le login', async ({ page }) => {
  for (const path of ['/dashboard', '/reports', '/admin', '/profile']) {
    await page.goto(`/#${path}`);
    await expect(page.getByTestId('page-login')).toBeVisible();
    await expect(page.getByTestId('login-next')).toHaveText(path);
  }
});

test('les routes publiques restent accessibles', async ({ page }) => {
  await page.goto('/#/public');
  await expect(page.getByTestId('page-public')).toBeVisible();

  await page.goto('/#/session');
  await expect(page.getByTestId('auth-state')).toHaveText('ANONYME');
});
