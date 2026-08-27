// URL de base de l'API.
//
// - Par défaut : production (Railway) — https://mariageplus-production.up.railway.app
// - Développement local : surcharger au build/run via VITE_API_BASE_URL,
//   ex. `VITE_API_BASE_URL=http://localhost:8000 npm run dev`
const DEFAULT_BASE_URL = 'https://mariageplus-production.up.railway.app'

function baseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  const raw = fromEnv.trim() || DEFAULT_BASE_URL
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

export const ApiConfig = {
  baseUrl: baseUrl(),

  // Auth (sans préfixe /api)
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  authRefresh: '/auth/refresh',
  authLogout: '/auth/logout',
  authMe: '/auth/me',

  weddingsPath: '/api/weddings',

  weddingGuestsPath: (weddingId: number) => `/api/weddings/${weddingId}/guests`,
  weddingCategoriesPath: (weddingId: number) => `/api/weddings/${weddingId}/guest-categories`,
  weddingInvitationsPath: (weddingId: number) => `/api/weddings/${weddingId}/invitations`,
  weddingEventsPath: (weddingId: number) => `/api/weddings/${weddingId}/events`,
  weddingTablesPath: (weddingId: number) => `/api/weddings/${weddingId}/tables`,
  weddingAssignmentsPath: (weddingId: number) => `/api/weddings/${weddingId}/assignments`,
  weddingDashboardPath: (weddingId: number) => `/api/weddings/${weddingId}/dashboard`,
  weddingRsvpsPath: (weddingId: number) => `/api/weddings/${weddingId}/rsvps`,

  checkinsPath: '/api/checkins',
  publicInvitationsPath: '/api/public/invitations',

  usersPath: '/api/users',
  rolesPath: '/api/roles',
  permissionsPath: '/api/permissions',
  organizationsPath: '/api/organizations',
}
