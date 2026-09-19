import { test, expect } from '@playwright/test';
import { ACCESS, CREDENTIALS, Role } from './roles';

/**
 * Ces tests tournent trois fois (projets admin / editor / viewer), chacun avec
 * son storageState. Aucun passage par le formulaire de login : c'est tout
 * l'intérêt de storageState.
 */
test.describe('autorisations par rôle', () => {
  test('la session est restaurée sans repasser par le login', async ({ page }, testInfo) => {
    const role = testInfo.project.name as Role;

    await page.goto('/#/dashboard');

    await expect(page.getByTestId('page-login')).toHaveCount(0);
    await expect(page.getByTestId('page-dashboard')).toBeVisible();
    await expect(page.getByTestId('current-role')).toHaveText(role);
    await expect(page.locator('body')).toHaveAttribute('data-auth', 'authenticated');
  });

  test('la matrice d’accès est respectée', async ({ page }, testInfo) => {
    const role = testInfo.project.name as Role;

    for (const [path, allowed] of Object.entries(ACCESS)) {
      await page.goto(`/#${path}`);

      if (allowed === null || allowed.includes(role)) {
        await expect(page.getByTestId('page-forbidden')).toHaveCount(0);
      } else {
        await expect(page.getByTestId('forbidden-code')).toHaveText('403');
        await expect(page.getByTestId('forbidden-path')).toHaveText(`#${path}`);
        await expect(page.getByTestId('forbidden-actual')).toHaveText(role);
      }
    }
  });

  test('les actions sensibles suivent le rôle', async ({ page }, testInfo) => {
    const role = testInfo.project.name as Role;
    await page.goto('/#/dashboard');

    await expect(page.getByTestId('action-read')).toBeEnabled();

    const canWrite = role !== 'viewer';
    await expect(page.getByTestId('action-write'))[canWrite ? 'toBeEnabled' : 'toBeDisabled']();

    const canDelete = role === 'admin';
    await expect(page.getByTestId('action-delete'))[canDelete ? 'toBeEnabled' : 'toBeDisabled']();
  });

  test('le profil correspond bien au compte du storageState', async ({ page }, testInfo) => {
    const role = testInfo.project.name as Role;
    await page.goto('/#/profile');

    await expect(page.getByTestId('profile-email')).toHaveText(CREDENTIALS[role].email);
    await expect(page.getByTestId('profile-role')).toHaveText(role);
  });
});
