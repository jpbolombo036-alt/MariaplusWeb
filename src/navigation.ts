import { Perm } from './permissions'

export type NavSection = 'overview' | 'guests' | 'categories' | 'invitations' | 'rsvp' | 'checkin' | 'tables' | 'internal-events' | 'statistics'

export interface NavEntry {
  label: string
  icon: string // Material Symbols class
  // Chemin relatif de la section à l'intérieur d'un mariage (si gestion d'événement).
  section?: NavSection
  // Route d'application fixe (entrée générale hors mariage).
  path?: string
  // Permissions requises (une seule suffit).
  perm?: string[]
}

// Entrées de la sidebar. Les entrées "générales" (Dashboard, Mes événements) ont
// une route d'application fixe ; les entrées "section" pointent vers un onglet du
// mariage sélectionné (/dashboard/events/{id}/{section}).
export const navEntries: NavEntry[] = [
  { label: 'Dashboard', icon: 'dashboard', perm: [Perm.dashboardView] },
  { label: 'Mes événements', icon: 'event', perm: [Perm.weddingView] },
  { label: 'Invités', icon: 'group', section: 'guests', perm: [Perm.guestView] },
  { label: 'Catégories', icon: 'category', section: 'categories', perm: [Perm.guestView] },
  { label: 'Invitations', icon: 'mail', section: 'invitations', perm: [Perm.invitationView] },
  { label: 'RSVP', icon: 'how_to_reg', section: 'rsvp', perm: [Perm.rsvpView] },
  { label: 'Check-in', icon: 'person_check', section: 'checkin', perm: [Perm.checkinView] },
  { label: 'Tables & Placements', icon: 'grid_view', section: 'tables', perm: [Perm.tableView] },
  { label: 'Événements internes', icon: 'business_center', section: 'internal-events', perm: [Perm.eventView] },
  { label: 'Statistiques', icon: 'analytics', section: 'statistics', perm: [Perm.statisticsView] },
  { label: 'Équipe', icon: 'manage_accounts', path: '/dashboard/members', perm: [Perm.organizationManageMembers] },
]

// Route d'application cible pour une entrée donnée, résolue avec l'ID du mariage
// sélectionné (null = entrée générale sans mariage).
export function navTo(entry: NavEntry, activeWeddingId?: number | null): string {
  if (entry.path) return entry.path
  if (entry.section) {
    if (!activeWeddingId) return '/dashboard/events'
    return `/dashboard/events/${activeWeddingId}/${entry.section}`
  }
  if (entry.label === 'Mes événements') return '/dashboard/events'
  return '/dashboard'
}

export function filterNav(myPerms: string[]): NavEntry[] {
  return navEntries.filter((e) => !e.perm || e.perm.some((p) => myPerms.includes(p)))
}

