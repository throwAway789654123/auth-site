# StorageState Lab

Banc d'essai pour `storageState` de Playwright avec une authentification à trois rôles.
Le site est un fichier HTML statique, sans backend ni réseau : les tests sont donc
parfaitement déterministes.

## Comptes

| Rôle   | E-mail             | Mot de passe |
|--------|--------------------|--------------|
| admin  | admin@demo.test    | `Admin123!`  |
| editor | editor@demo.test   | `Editor123!` |
| viewer | viewer@demo.test   | `Viewer123!` |

## Matrice d'accès

| Route         | admin | editor | viewer | anonyme |
|---------------|-------|--------|--------|---------|
| `#/public`    | ✅ | ✅ | ✅ | ✅ |
| `#/session`   | ✅ | ✅ | ✅ | ✅ |
| `#/dashboard` | ✅ | ✅ | ✅ | ⛔ |
| `#/reports`   | ✅ | ✅ | ⛔ | ⛔ |
| `#/admin`     | ✅ | ⛔ | ⛔ | ⛔ |
| `#/profile`   | ✅ | ✅ | ✅ | ⛔ |

Une route protégée atteinte sans session redirige vers `#/login?next=<route>`.
Atteinte avec le mauvais rôle, elle affiche une page 403.

## Ce que le site permet de tester

- **Cookies + localStorage** : la session écrit `sst_session` / `sst_role` (cookies)
  et `sst.session` (localStorage). C'est exactement le périmètre de `storageState`.
- **sessionStorage** : au login, l'option « persistance » permet de stocker la session
  en `sessionStorage`. `storageState` ne la capture pas — le piège classique est
  reproductible à volonté.
- **Expiration** : une durée de session de 10 s permet de tester un `storageState` périmé
  (avec `context.clock` pour ne pas attendre).
- **Inspecteur** (`#/session`) : affiche cookies, localStorage et sessionStorage réels,
  accessible sans authentification — parfait pour assertir ce qui a été restauré.

Tous les éléments utiles portent un `data-testid` stable, et `<body>` expose
`data-auth`, `data-role` et `data-route`.

## Démarrage

```bash
npm install
npx playwright install chromium
npm test
```

`playwright.config.ts` démarre automatiquement `npx serve ./site` sur le port 4173.
Pour viser une instance déployée :

```bash
BASE_URL=https://mon-site.example npx playwright test
```

## Structure des projets

```
setup      → tests/auth.setup.ts : un login réel par rôle, écrit .auth/<role>.json
admin      → storageState .auth/admin.json
editor     → storageState .auth/editor.json
viewer     → storageState .auth/viewer.json
anonymous  → storageState vide, tests négatifs
```

Les projets `admin` / `editor` / `viewer` rejouent les mêmes specs : les assertions
lisent `testInfo.project.name` pour connaître le rôle attendu.

## Fichiers

- `site/index.html` — l'application
- `playwright.config.ts` — projets, dépendances et `webServer`
- `tests/roles.ts` — identifiants et matrice d'accès partagés
- `tests/auth.setup.ts` — génération des `storageState`
- `tests/access.spec.ts` — autorisations par rôle
- `tests/storage-state.spec.ts` — anatomie du fichier JSON et pièges classiques
- `tests/anonymous.spec.ts` — contexte non authentifié
