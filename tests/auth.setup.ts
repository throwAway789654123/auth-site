import { test as setup, expect } from '@playwright/test';
import { CREDENTIALS, STATE_FILE, Role } from './roles';

/**
 * Un `setup` par rôle. Chaque test se connecte pour de vrai puis sérialise
 * cookies + localStorage dans .auth/<role>.json.
 *
 * Point clé : on choisit explicitement la persistance "localStorage".
 * Avec "sessionStorage", storageState ne capturerait RIEN — voir storage-state.spec.ts.
 */
for (const role of Object.keys(CREDENTIALS) as Role[]) {
  setup(`authentification — ${role}`, async ({ page }) => {
    const { email, password, name } = CREDENTIALS[role];

    await page.goto('/#/login');
    await expect(page.getByTestId('page-login')).toBeVisible();

    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-persistence').selectOption('local');
    await page.getByTestId('login-ttl').selectOption('86400');
    await page.getByTestId('login-submit').click();

    // On attend un signal côté application, jamais un waitForTimeout.
    await expect(page.getByTestId('page-dashboard')).toBeVisible();
    await expect(page.getByTestId('current-user')).toHaveText(name);
    await expect(page.getByTestId('current-role')).toHaveText(role);

    await page.context().storageState({ path: STATE_FILE(role) });
  });
}
