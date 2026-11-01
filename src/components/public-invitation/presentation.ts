import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { ApiConfig } from '../../api/config'
import type { PublicInvitation, PublicSessionItem } from '../../api/publicInvitation'

interface InvitationExtras {
  eventType?: string
  organizerPhone?: string
  organizerEmail?: string
  rsvpDeadline?: string
}

/* Date / heure / lieu (formatage UI de données déjà fournies par le backend) */
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function parseFrenchDate(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})\s+([a-zà-ÿ]+)\s+(\d{4})$/i)
  if (!m) return null
  const idx = MONTHS_FR.findIndex((mo) => mo.toLowerCase() === m[2]?.toLowerCase())
  if (idx < 0) return null
  return new Date(Number(m[3]), idx, Number(m[1]))
}


function safeMapUrl(value?: string | null): string {
  const raw = value?.trim() || ''
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

function coordinatesMapUrl(latitude?: number | null, longitude?: number | null): string {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return ''
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

function addressMapUrl(venue?: string, sub?: string): string {
  const query = [venue, sub].filter(Boolean).join(', ').trim()
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : ''
}


export function safeColorHex(value?: string | null): string {
  const color = value?.trim() || ''
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#d9d0e8'
}


export function sessionTime(s: PublicSessionItem): string {
  const fmt = (t?: string | null) => {
    if (!t) return ''
    const m = t.match(/^(\d{1,2}):(\d{2})/)
    return m ? `${m[1]}h${m[2]}` : t
  }
  const start = fmt(s.startTime)
  const end = fmt(s.endTime)
  return [start, end].filter(Boolean).join(' – ')
}

export function sessionDateLabel(s: PublicSessionItem): string {
  if (!s.sessionDate) return ''
  const d = new Date(`${s.sessionDate}T00:00:00`)
  if (isNaN(d.getTime())) return s.sessionDate
  try {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  } catch {
    return s.sessionDate
  }
}

export function sessionPlace(s: PublicSessionItem): string {
  return [s.venueName, s.city].filter(Boolean).join(', ')
}

export function sessionMapUrl(s: PublicSessionItem): string {
  return safeMapUrl(s.mapUrl) || coordinatesMapUrl(s.latitude, s.longitude)
}

/** Libellés FR des types de session (badge du programme — source : enum EventSessionType). */
const SESSION_TYPE_LABELS: Record<string, string> = {
  CIVIL_CEREMONY: 'Cérémonie civile',
  RELIGIOUS_CEREMONY: 'Bénédiction',
  RECEPTION: 'Réception',
  AFTER_PARTY: 'Soirée',
  OTHER: 'Autre',
}

export function sessionTypeLabel(t?: string | null): string {
  if (!t) return ''
  return SESSION_TYPE_LABELS[t] ?? t
}


export function absoluteUrl(u?: string | null): string {
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('/')) return ApiConfig.baseUrl + u
  return u
}


export function useInvitationPresentation(source: MaybeRefOrGetter<PublicInvitation | null>) {
  const inv = computed(() => toValue(source))
  /* ---------- Données dérivées (source de vérité = backend) ---------- */
  const maxAccepted = computed(() => {
    const n = inv.value?.maxAccepted
    return n != null && n > 0 ? n : 1
  })

  const firstNameText = computed(() => {
    const fn = inv.value?.guestFirstName?.trim()
    return fn ? fn : 'cher invité'
  })

  const title = computed(
    () => inv.value?.weddingDisplayName?.trim() || inv.value?.eventName?.trim() || 'Notre invitation',
  )

  /* Type — affiché uniquement si le backend l'expose (eventType). Sinon, badge masqué. */
  const TYPE_LABELS: Record<string, string> = {
    WEDDING: 'Mariage',
    COLLATION: 'Collation',
    BIRTHDAY: 'Anniversaire',
    GRADUATION: 'Diplôme',
    PARTY: 'Fête',
    CONFERENCE: 'Conférence',
    OTHER: 'Événement',
  }
  const typeLabel = computed(() => {
    const t = (inv.value as InvitationExtras | null)?.eventType
    return t ? TYPE_LABELS[t] ?? t : ''
  })

  const dateValue = computed(() => inv.value?.eventDate?.trim() || '')
  const dayOfWeekText = computed(() => {
    if (!dateValue.value) return ''
    const d = parseFrenchDate(dateValue.value)
    if (!d) return ''
    try {
      return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(d)
    } catch {
      return ''
    }
  })
  const timeValue = computed(() => {
    const t = inv.value?.eventStartTime?.trim()
    if (!t) return ''
    const m = t.match(/^(\d{1,2})h(\d{2})$/)
    return m ? `${m[1]}:${m[2]}` : t
  })
  const venueParts = computed(() =>
    (inv.value?.eventVenue?.trim() || '').split(',').map((s) => s.trim()).filter(Boolean),
  )
  const venueValue = computed(() => venueParts.value[0] || '')
  const venueSub = computed(() => (venueParts.value.length > 1 ? venueParts.value.slice(1).join(' · ') : ''))
  const venueMapUrl = computed(() =>
    safeMapUrl(inv.value?.mapUrl)
    || coordinatesMapUrl(inv.value?.latitude, inv.value?.longitude)
    || addressMapUrl(venueValue.value, venueSub.value),
  )
  const hasEventInfo = computed(() => Boolean(dateValue.value || timeValue.value || venueValue.value))
  /** Vestiaire : jusqu'à 3 couleurs demandées + photo du pagne (libellés FR fournis par l'API). */
  const dressColors = computed(() => inv.value?.dressColors ?? [])
  const dressImageUrl = computed(() => inv.value?.dressImageUrl || '')
  /* ---------- Programme de la journée (sessions backend — additif) ---------- */
  const programSessions = computed<PublicSessionItem[]>(() => {
    const list = inv.value?.sessions
    return Array.isArray(list) ? list.filter((s) => s && s.name) : []
  })

  /* Coordonnées organisateur & date limite — uniquement si le backend les fournit. */
  const helpPhone = computed(() => String((inv.value as InvitationExtras | null)?.organizerPhone ?? ''))
  const helpEmail = computed(() => String((inv.value as InvitationExtras | null)?.organizerEmail ?? ''))
  const deadlineText = computed(() => {
    const d = (inv.value as InvitationExtras | null)?.rsvpDeadline
    if (!d) return ''
    const parsed = parseFrenchDate(String(d)) || new Date(String(d))
    if (isNaN(parsed.getTime())) return String(d)
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed)
  })

  const photos = computed<string[]>(() => {
    const weddingPhotos = [
      inv.value?.couplePhotoUrl,
      inv.value?.groomPhotoUrl,
      inv.value?.bridePhotoUrl,
    ]
    const list = weddingPhotos.some((u) => !!u && u.trim() !== '')
      ? weddingPhotos
      : [inv.value?.eventPhotoUrl]
    return list.filter((u): u is string => !!u && u.trim() !== '')
  })

  const guestFullName = computed(() => {
    const fn = inv.value?.guestFirstName?.trim() ?? ''
    const ln = inv.value?.guestLastName?.trim() ?? ''
    return `${fn} ${ln}`.trim() || 'Cher invité'
  })


  return {
    maxAccepted, firstNameText, title, typeLabel, dateValue, dayOfWeekText, timeValue,
    venueValue, venueSub, venueMapUrl, hasEventInfo, dressColors, dressImageUrl,
    programSessions, helpPhone, helpEmail, deadlineText, photos, guestFullName,
  }
}
