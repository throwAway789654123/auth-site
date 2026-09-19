export type Role = 'admin' | 'editor' | 'viewer';

export const CREDENTIALS: Record<Role, { email: string; password: string; name: string }> = {
  admin: { email: 'admin@demo.test', password: 'Admin123!', name: 'Alice Admin' },
  editor: { email: 'editor@demo.test', password: 'Editor123!', name: 'Edgar Editor' },
  viewer: { email: 'viewer@demo.test', password: 'Viewer123!', name: 'Vera Viewer' },
};

export const STATE_FILE = (role: Role) => `.auth/${role}.json`;

/** Matrice d'accès attendue, miroir de celle affichée sur la page publique. */
export const ACCESS: Record<string, Role[] | null> = {
  '/public': null,
  '/session': null,
  '/dashboard': ['admin', 'editor', 'viewer'],
  '/reports': ['admin', 'editor'],
  '/admin': ['admin'],
  '/profile': ['admin', 'editor', 'viewer'],
};
