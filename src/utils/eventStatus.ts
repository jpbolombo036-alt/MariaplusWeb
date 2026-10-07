import type { Event } from '../api/events'

/** Statuts français du cycle de vie d'un événement. */
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'À venir',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminé',
  ARCHIVED: 'Archivé',
  CANCELLED: 'Annulé',
}

/** Types français (libellés affichés dans le dashboard). */
const TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Mariage',
  COLLATION: 'Collation',
  ANNIVERSARY: 'Anniversaire',
  BAPTISM: 'Baptême',
  GRADUATION: 'Graduation',
  OTHER: 'Autre',
}

export function statusLabel(status?: string | null): string {
  return (status && STATUS_LABELS[status]) || status || ''
}

export function eventTypeLabel(type?: string | null): string {
  return (type && TYPE_LABELS[type]) || type || 'ÉVÉNEMENT'
}

/**
 * Un événement est « passé » s'il est terminé/archivé, ou si sa date est
 * antérieure à aujourd'hui ; un événement annulé n'est jamais « passé ».
 * Règle unique partagée par le sélecteur du dashboard et « Mes Événements ».
 */
export function isPastEvent(ev: Pick<Event, 'status' | 'eventDate'>): boolean {
  if (ev.status === 'ARCHIVED' || ev.status === 'COMPLETED') return true
  if (ev.status === 'CANCELLED') return false
  if (!ev.eventDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(ev.eventDate + 'T00:00:00').getTime() < today.getTime()
}

/** Date affichable : « 12 oct. 2026 · 14:30 ». Chaîne vide si non renseignée. */
export function eventDateLabel(ev: Pick<Event, 'eventDate' | 'startTime'>): string {
  if (!ev.eventDate) return ''
  const txt = new Date(ev.eventDate + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return ev.startTime ? `${txt} · ${String(ev.startTime).slice(0, 5)}` : txt
}

/** Priorité de sélection par défaut : ACTIVE → PUBLISHED → DRAFT → autres. */
function defaultRank(ev: Event): number {
  if (ev.status === 'ACTIVE') return 0
  if (ev.status === 'PUBLISHED') return 1
  if (ev.status === 'DRAFT') return 2
  return 3
}

/** Date en timestamp ; fallback sur la date de création, sinon le maximum. */
function dateValue(ev: Event): number {
  if (ev.eventDate) return new Date(ev.eventDate + 'T00:00:00').getTime()
  if (ev.createdAt) return new Date(ev.createdAt).getTime()
  return Number.MAX_SAFE_INTEGER
}

/**
 * Tri du sélecteur : les événements à venir d'abord (date croissante, statut
 * avancé prioritaire), puis les passés (date décroissante). Tout reste visible,
 * seul l'ordre change.
 */
export function sortEventsForSelector(events: Event[]): Event[] {
  const upcoming = events.filter((e) => !isPastEvent(e))
  const past = events.filter((e) => isPastEvent(e))
  upcoming.sort((a, b) => defaultRank(a) - defaultRank(b) || dateValue(a) - dateValue(b))
  past.sort((a, b) => dateValue(b) - dateValue(a))
  return [...upcoming, ...past]
}

/**
 * Événement actif par défaut, par cascade :
 * 1. choix de session s'il existe toujours et n'est ni passé ni annulé ;
 * 2. sinon l'événement à venir le plus pertinent (actif, publié, brouillon) ;
 * 3. sinon — tous passés — le plus récent, pour ne jamais casser l'écran.
 */
export function pickDefaultEventId(events: Event[], savedId?: number | null): number | null {
  if (!events.length) return null
  if (savedId != null) {
    const saved = events.find((e) => e.id === savedId)
    if (saved && !isPastEvent(saved) && saved.status !== 'CANCELLED') return saved.id
  }
  const candidates = events.filter((e) => !isPastEvent(e) && e.status !== 'CANCELLED')
  if (candidates.length) {
    candidates.sort((a, b) => defaultRank(a) - defaultRank(b) || dateValue(a) - dateValue(b))
    return candidates[0].id
  }
  const past = [...events].sort((a, b) => dateValue(b) - dateValue(a))
  return past[0].id
}
