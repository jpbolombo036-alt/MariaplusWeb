// URL de base de l'API.
//
// - Par défaut : production (Railway) — https://mariageplus-production-a657.up.railway.app
// - Développement local : surcharger au build/run via VITE_API_BASE_URL,
//   ex. `VITE_API_BASE_URL=http://localhost:8000 npm run dev`
// NB : le protocole https:// est OBLIGATOIRE — sans schéma, axios traiterait
// la valeur comme un chemin relatif et les requêtes partiraient vers le
// serveur frontend (localhost:3000 en dev) au lieu du backend → 404.
const DEFAULT_BASE_URL = 'https://mariageplus-production-a657.up.railway.app'

// Numéro WhatsApp de contact PAR DÉFAUT de la plateforme (bouton flottant de
// la landing). Public par nature : c'est un lien wa.me affiché sur la page
// d'accueil, pas un secret. Défini ici en dur pour que le bouton s'affiche
// aussi en production (Vercel), où `.env.local` n'est pas déployé.
// Surchargable via VITE_WHATSAPP_CONTACT (format international sans "+"
// ni espaces).
const DEFAULT_WHATSAPP_CONTACT = '243847381745'

function baseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  let raw = fromEnv.trim() || DEFAULT_BASE_URL
  // Sécurité : si l'URL est saisie sans protocole (ex. "mon-api.up.railway.app"),
  // axios la traiterait comme un chemin relatif → requêtes envoyées au serveur
  // frontend (localhost:3000 en dev) au lieu du backend → 404.
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
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

  // Bascule Event (racine unifiée) : les mariages sont désormais des
  // événements de type WEDDING servis par /api/events (voir
  // docs/DESIGN_EVENT_AS_ROOT.md côté backend).
  eventsPath: '/api/events',
  weddingGuestsPath: (eventId: number) => `/api/events/${eventId}/guests`,
  weddingCategoriesPath: (eventId: number) => `/api/events/${eventId}/guest-categories`,
  weddingInvitationsPath: (eventId: number) => `/api/events/${eventId}/invitations`,
  weddingBulkSendPath: (eventId: number) => `/api/events/${eventId}/invitations/send-bulk`,
  weddingEventsPath: (eventId: number) => `/api/events/${eventId}/sessions`,
  weddingTablesPath: (eventId: number) => `/api/events/${eventId}/tables`,
  weddingAssignmentsPath: (eventId: number) => `/api/events/${eventId}/assignments`,
  weddingDashboardPath: (eventId: number) => `/api/events/${eventId}/dashboard`,
  weddingRsvpsPath: (eventId: number) => `/api/events/${eventId}/rsvps`,
  weddingDrinksPath: (eventId: number) => `/api/events/${eventId}/drinks`,
  weddingGalleryPath: (eventId: number) => `/api/events/${eventId}/gallery`,
  // Exports (CSV/PDF) — contrôleur ExportController : /api/events/{id}/export/...
  weddingExportPath: (eventId: number) => `/api/events/${eventId}/export`,

  checkinsPath: '/api/checkins',
  // Réglages plateforme (lecture : tout utilisateur authentifié ; écriture : SUPER_ADMIN)
  adminWhatsappSettingsPath: '/api/admin/settings/whatsapp',
  publicInvitationsPath: '/api/public/invitations',

  usersPath: '/api/users',
  rolesPath: '/api/roles',
  permissionsPath: '/api/permissions',
  organizationsPath: '/api/organizations',

  // Numéro WhatsApp de contact de la plateforme (bouton flottant de la landing).
  // Priorité : VITE_WHATSAPP_CONTACT si défini, sinon DEFAULT_WHATSAPP_CONTACT
  // (défini plus haut) pour que le bouton soit visible en production.
  whatsappContactNumber:
    (import.meta.env.VITE_WHATSAPP_CONTACT as string | undefined)?.replace(/[^0-9]/g, '') ||
    DEFAULT_WHATSAPP_CONTACT,
}
