import { test, expect, chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { CREDENTIALS, STATE_FILE, Role } from './roles';

test.describe('anatomie du storageState', () => {
  test('le fichier contient bien le cookie de session et la clé localStorage', async ({}, testInfo) => {
    const role = testInfo.project.name as Role;
    const state = JSON.parse(readFileSync(STATE_FILE(role), 'utf8'));

    const cookieNames = state.cookies.map((c: any) => c.name);
    expect(cookieNames).toContain('sst_session');
    expect(cookieNames).toContain('sst_role');
    expect(state.cookies.find((c: any) => c.name === 'sst_role').value).toBe(role);

    const origin = state.origins[0];
    expect(origin, 'aucune origine sérialisée').toBeTruthy();
    const keys = origin.localStorage.map((e: any) => e.name);
    expect(keys).toContain('sst.session');

    const session = JSON.parse(
      origin.localStorage.find((e: any) => e.name === 'sst.session').value
    );
    expect(session.role).toBe(role);
    expect(session.email).toBe(CREDENTIALS[role].email);
  });

  test('l’inspecteur reflète ce qui a été restauré', async ({ page }, testInfo) => {
    const role = testInfo.project.name as Role;
    await page.goto('/#/session');

    await expect(page.getByTestId('auth-state')).toHaveText('AUTHENTIFIÉ');
    await expect(page.getByTestId('cookies-table').locator('tr[data-key="sst_role"] td.v')).toHaveText(role);
    await expect(page.getByTestId('localstorage-table').locator('tr[data-key="sst.session"]')).toBeVisible();

    // sessionStorage n'est jamais restauré par storageState.
    await expect(page.getByTestId('sessionstorage-table-empty')).toBeVisible();
  });
});

test.describe('pièges classiques', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('une session en sessionStorage n’est PAS capturée', async ({ page }, testInfo) => {
    await page.goto('/#/login');
    await page.getByTestId('login-email').fill(CREDENTIALS.admin.email);
    await page.getByTestId('login-password').fill(CREDENTIALS.admin.password);
    await page.getByTestId('login-persistence').selectOption('session');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('page-dashboard')).toBeVisible();

    const statePath = testInfo.outputPath('session-only.json');
    await page.context().storageState({ path: statePath });

    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    const origin = state.origins[0];
    const lsKeys = origin ? origin.localStorage.map((e: any) => e.name) : [];
    expect(lsKeys).not.toContain('sst.session');

    // Rejoué dans un contexte neuf, ce state laisse l'utilisateur non authentifié
    // côté application (le cookie seul ne suffit pas ici).
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ storageState: statePath, baseURL: testInfo.project.use.baseURL });
    const fresh = await ctx.newPage();
    await fresh.goto('/#/session');
    await expect(fresh.getByTestId('auth-state')).toHaveText('ANONYME');
    await browser.close();
  });

  test('un storageState expiré retombe sur le login', async ({ page }, testInfo) => {
    await page.goto('/#/login');
    await page.getByTestId('login-email').fill(CREDENTIALS.admin.email);
    await page.getByTestId('login-password').fill(CREDENTIALS.admin.password);
    await page.getByTestId('login-ttl').selectOption('10'); // 10 secondes
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('page-dashboard')).toBeVisible();

    const statePath = testInfo.outputPath('short-lived.json');
    await page.context().storageState({ path: statePath });

    const browser = await chromium.launch();
    const ctx = await browser.newContext({ storageState: statePath, baseURL: testInfo.project.use.baseURL });
    const fresh = await ctx.newPage();

    // On avance l'horloge plutôt que d'attendre : plus rapide et déterministe.
    await ctx.clock.install();
    await ctx.clock.fastForward('00:30');

    await fresh.goto('/#/dashboard');
    await expect(fresh.getByTestId('page-login')).toBeVisible();
    await browser.close();
  });
});
