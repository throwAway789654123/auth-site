import { defineConfig, devices } from '@playwright/test';

/**
 * Le site est statique : on le sert en local via `npx serve ./site`.
 * Pour viser une version déployée, exporte BASE_URL avant de lancer les tests.
 */
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npx --yes serve ./site -l 4173',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },

  projects: [
    // 1. Un projet de setup par rôle : il se connecte une fois et écrit le storageState.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // 2. Les projets de test réutilisent le storageState et dépendent du setup.
    {
      name: 'admin',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
    },
    {
      name: 'editor',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: '.auth/editor.json' },
    },
    {
      name: 'viewer',
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: '.auth/viewer.json' },
    },
    {
      // Contexte vierge : sert aux tests négatifs (redirection vers /login).
      name: 'anonymous',
      testMatch: /anonymous\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
    },
  ],
});
