import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface PublicInvitation {
  guestFirstName?: string | null
  guestLastName?: string | null
  weddingDisplayName?: string | null
  couplePhotoUrl?: string | null
  groomPhotoUrl?: string | null
  bridePhotoUrl?: string | null
  message?: string | null
  eventName?: string | null
  eventDate?: string | null
  eventStartTime?: string | null
  eventVenue?: string | null
  maxAccepted?: number | null
  status: string
  rsvpStatus?: string | null
  rsvpNumberOfAttendees?: number | null
  rsvpDrinkChoice?: string | null
  rsvpDrinkChoices?: string[] | null
  publicToken?: string | null
  /** Programme de la journée (sessions actives de l'événement) — additif. */
  sessions?: PublicSessionItem[] | null
}

export interface PublicRsvp {
  invitationStatus: string
  rsvpStatus: string
  numberOfAttendees: number
}

/** Session du programme de la journée (additif — peut être absent). */
export interface PublicSessionItem {
  name: string
  type?: string | null
  description?: string | null
  sessionDate?: string | null
  startTime?: string | null
  endTime?: string | null
  venueName?: string | null
  venueAddress?: string | null
  city?: string | null
  mapUrl?: string | null
}

export interface PublicDrink {
  id: number
  name: string
  description?: string | null
  displayOrder?: number | null
  active: boolean
  /** Photo de la boisson (carte visuelle du RSVP) ; null si aucune. */
  imageUrl?: string | null
}

export async function getPublicInvitation(token: string): Promise<PublicInvitation> {
  const res = await http.get(`${ApiConfig.publicInvitationsPath}/${token}`)
  const j = decodeMap(res.data)
  return {
    guestFirstName: j.guestFirstName ? String(j.guestFirstName) : null,
    guestLastName: j.guestLastName ? String(j.guestLastName) : null,
    weddingDisplayName: j.weddingDisplayName ? String(j.weddingDisplayName) : null,
    couplePhotoUrl: j.couplePhotoUrl ? String(j.couplePhotoUrl) : null,
    groomPhotoUrl: j.groomPhotoUrl ? String(j.groomPhotoUrl) : null,
    bridePhotoUrl: j.bridePhotoUrl ? String(j.bridePhotoUrl) : null,
    message: j.message ? String(j.message) : null,
    eventName: j.eventName ? String(j.eventName) : null,
    eventDate: j.eventDate ? String(j.eventDate) : null,
    eventStartTime: j.eventStartTime ? String(j.eventStartTime) : null,
    eventVenue: j.eventVenue ? String(j.eventVenue) : null,
    maxAccepted: j.maxAccepted != null ? Number(j.maxAccepted) : null,
    status: String(j.status ?? ''),
    rsvpStatus: j.rsvpStatus ? String(j.rsvpStatus) : null,
    rsvpNumberOfAttendees: j.rsvpNumberOfAttendees != null ? Number(j.rsvpNumberOfAttendees) : null,
    rsvpDrinkChoice: j.rsvpDrinkChoice ? String(j.rsvpDrinkChoice) : null,
    rsvpDrinkChoices: Array.isArray(j.rsvpDrinkChoices)
      ? (j.rsvpDrinkChoices as unknown[]).map((x) => String(x))
      : null,
    publicToken: j.publicToken ? String(j.publicToken) : null,
    sessions: Array.isArray(j.sessions)
      ? (j.sessions as Record<string, unknown>[]).map((s) => ({
          name: String(s.name ?? ''),
          type: s.type ? String(s.type) : null,
          description: s.description ? String(s.description) : null,
          sessionDate: s.sessionDate ? String(s.sessionDate) : null,
          startTime: s.startTime ? String(s.startTime) : null,
          endTime: s.endTime ? String(s.endTime) : null,
          venueName: s.venueName ? String(s.venueName) : null,
          venueAddress: s.venueAddress ? String(s.venueAddress) : null,
          city: s.city ? String(s.city) : null,
          mapUrl: s.mapUrl ? String(s.mapUrl) : null,
        }))
      : null,
  }
}

export async function listPublicDrinks(token: string): Promise<PublicDrink[]> {
  const res = await http.get(`${ApiConfig.publicInvitationsPath}/${token}/drinks`)
  const j = decodeList(res.data)
  return (decodeList(res.data) as Record<string, unknown>[]).map((d) => ({
    id: Number(d.id ?? 0),
    name: String(d.name ?? ''),
    description: d.description ? String(d.description) : null,
    displayOrder: d.displayOrder != null ? Number(d.displayOrder) : null,
    active: Boolean(d.active ?? true),
  }))
}

export async function submitPublicRsvp(token: string, status: string, attendees: number, drinkChoices?: string[]): Promise<PublicRsvp> {
  const res = await http.post(`${ApiConfig.publicInvitationsPath}/${token}/rsvp`, {
    status,
    numberOfAttendees: attendees,
    drinkChoices: drinkChoices && drinkChoices.length ? drinkChoices : undefined,
  })
  const j = decodeMap(res.data)
  return {
    invitationStatus: String(j.invitationStatus ?? ''),
    rsvpStatus: String(j.rsvpStatus ?? ''),
    numberOfAttendees: Number(j.numberOfAttendees ?? 0),
  }
}

/** URL publique de la carte d'invitation confirmée (PNG enregistré côté serveur). */
export function publicCardUrl(token: string): string {
  return `${ApiConfig.baseUrl}${ApiConfig.publicInvitationsPath}/${token}/card`
}

/** Enregistre la carte PNG générée côté navigateur (multipart) — consultable par l'agent d'accueil. */
export async function uploadCardImage(token: string, blob: Blob): Promise<void> {
  const form = new FormData()
  form.append('file', blob, 'invitation-confirmee.png')
  await http.post(`${ApiConfig.publicInvitationsPath}/${token}/card`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
