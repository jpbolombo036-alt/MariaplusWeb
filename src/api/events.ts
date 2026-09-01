import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface WeddingDetails {
  id?: number
  eventId?: number
  groomFirstName?: string | null
  groomLastName?: string | null
  brideFirstName?: string | null
  brideLastName?: string | null
  groomPhotoUrl?: string | null
  bridePhotoUrl?: string | null
  couplePhotoUrl?: string | null
  welcomeMessage?: string | null
  displayName?: string | null
}

export interface EventSession {
  id?: number
  eventId?: number
  name?: string
  type?: string
  description?: string | null
  sessionDate?: string | null
  startTime?: string | null
  endTime?: string | null
  venueName?: string | null
  venueAddress?: string | null
  city?: string | null
  commune?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  mapUrl?: string | null
  displayOrder?: number | null
  active?: boolean | null
}

export interface Event {
  id: number
  organizationId: number
  name: string
  type: string
  description?: string | null
  message?: string | null
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
  venueName?: string | null
  venueAddress?: string | null
  city?: string | null
  commune?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  mapUrl?: string | null
  status: string
  displayOrder?: number | null
  active?: boolean | null
  createdAt?: string | null
  updatedAt?: string | null
  hasImage?: boolean | null
  weddingDetails?: WeddingDetails | null
  sessions?: EventSession[] | null
}

/** Charge la photo de couverture en blob URL (null si 404 = pas de photo). */
export async function loadEventImage(eventId: number): Promise<string | null> {
  try {
    const res = await http.get(`${ApiConfig.eventsPath}/${eventId}/image`, { responseType: 'blob' })
    return URL.createObjectURL(res.data as Blob)
  } catch {
    return null
  }
}

export async function uploadEventImage(eventId: number, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await http.put(`${ApiConfig.eventsPath}/${eventId}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function deleteEventImage(eventId: number): Promise<void> {
  await http.delete(`${ApiConfig.eventsPath}/${eventId}/image`)
}

export type EventPhotoKind = 'groom' | 'bride' | 'couple'

export async function uploadEventPhoto(eventId: number, kind: EventPhotoKind, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await http.put(`${ApiConfig.eventsPath}/${eventId}/photos/${kind}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** URL absolue affichable d'une photo (le backend peut renvoyer un chemin relatif). */
export function absolutePhotoUrl(url: string): string {
  // La couverture est chargée en blob par le navigateur : laisser "blob:" et "http(s)://"
  // intacts, ne préfixer que les URLs relatives (/api/...).
  return url.startsWith('http') || url.startsWith('blob:') ? url : ApiConfig.baseUrl + url
}

export interface PageData<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

function buildEventName(p: Record<string, unknown>): string {
  const groom = `${p.groomFirstName ?? ''} ${p.groomLastName ?? ''}`.trim()
  const bride = `${p.brideFirstName ?? ''} ${p.brideLastName ?? ''}`.trim()
  const composed = `${groom} & ${bride}`.trim()
  // Si aucun nom de marié/mariée n'est renseigné, on ne renvoie pas « & » nu.
  return composed === '&' || !composed ? 'Événement' : composed
}

const WEDDING_DETAIL_FIELDS = [
  'groomFirstName', 'groomLastName', 'brideFirstName', 'brideLastName',
  'groomPhotoUrl', 'bridePhotoUrl', 'couplePhotoUrl', 'welcomeMessage',
] as const

export function parseEvent(json: Record<string, unknown>): Event {
  const details = (json.weddingDetails ?? null) as WeddingDetails | null
  return {
    id: Number(json.id ?? 0),
    organizationId: Number(json.organizationId ?? 0),
    name: String(json.name ?? ''),
    type: String(json.type ?? 'OTHER'),
    description: json.description ? String(json.description) : null,
    message: json.message ? String(json.message) : null,
    eventDate: json.eventDate ? String(json.eventDate) : null,
    startTime: json.startTime ? String(json.startTime) : null,
    endTime: json.endTime ? String(json.endTime) : null,
    venueName: json.venueName ? String(json.venueName) : null,
    venueAddress: json.venueAddress ? String(json.venueAddress) : null,
    city: json.city ? String(json.city) : null,
    commune: json.commune ? String(json.commune) : null,
    country: json.country ? String(json.country) : null,
    latitude: json.latitude != null ? Number(json.latitude) : null,
    longitude: json.longitude != null ? Number(json.longitude) : null,
    mapUrl: json.mapUrl ? String(json.mapUrl) : null,
    status: String(json.status ?? 'DRAFT'),
    displayOrder: json.displayOrder != null ? Number(json.displayOrder) : null,
    active: json.active != null ? Boolean(json.active) : null,
    createdAt: json.createdAt ? String(json.createdAt) : null,
    updatedAt: json.updatedAt ? String(json.updatedAt) : null,
    hasImage: json.hasImage != null ? Boolean(json.hasImage) : null,
    weddingDetails: details,
    sessions: Array.isArray(json.sessions) ? (json.sessions as EventSession[]) : null,
  }
}

export async function listEvents(type?: string, page = 0, size = 25): Promise<Event[]> {
  const params: Record<string, unknown> = { page, size }
  if (type) params.type = type
  const res = await http.get(ApiConfig.eventsPath, { params })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseEvent(e as Record<string, unknown>))
}

export async function getEvent(id: number): Promise<Event> {
  const res = await http.get(`${ApiConfig.eventsPath}/${id}`)
  return parseEvent(decodeMap(res.data))
}

export async function createEvent(payload: Record<string, unknown>): Promise<Event> {
  // Le type vient du formulaire (WEDDING, BAPTISM, ANNIVERSARY...) ;
  // WEDDING par défaut pour le dialogue « Nouveau mariage ».
  const type = String(payload.type ?? 'WEDDING')

  const weddingDetails: Record<string, unknown> = {}
  for (const field of WEDDING_DETAIL_FIELDS) {
    if (payload[field] !== undefined) weddingDetails[field] = payload[field]
  }

  const eventPayload: Record<string, unknown> = {
    // Nom saisi par l'utilisateur s'il existe ; sinon, pour un mariage
    // créé via le dialogue sans champ name, on le compose « Groom & Bride ».
    name: (typeof payload.name === 'string' && payload.name.trim())
      ? payload.name.trim()
      : buildEventName(payload),
    type,
  }
  // SUPER_ADMIN : le backend exige l'organisation ciblée
  if (payload.organizationId != null) {
    eventPayload.organizationId = Number(payload.organizationId)
  }
  if (Object.keys(weddingDetails).length > 0) eventPayload.weddingDetails = weddingDetails
  if (payload.description !== undefined) eventPayload.description = payload.description
  if (payload.message !== undefined) eventPayload.message = payload.message
  if (payload.eventDate !== undefined) eventPayload.eventDate = payload.eventDate
  if (payload.startTime !== undefined) eventPayload.startTime = payload.startTime
  if (payload.endTime !== undefined) eventPayload.endTime = payload.endTime
  if (payload.venueName !== undefined) eventPayload.venueName = payload.venueName
  if (payload.venueAddress !== undefined) eventPayload.venueAddress = payload.venueAddress
  if (payload.city !== undefined) eventPayload.city = payload.city
  if (payload.commune !== undefined) eventPayload.commune = payload.commune
  if (payload.country !== undefined) eventPayload.country = payload.country
  if (payload.latitude !== undefined) eventPayload.latitude = payload.latitude
  if (payload.longitude !== undefined) eventPayload.longitude = payload.longitude
  if (payload.mapUrl !== undefined) eventPayload.mapUrl = payload.mapUrl
  const res = await http.post(ApiConfig.eventsPath, eventPayload)
  return parseEvent(decodeMap(res.data))
}

export async function updateEvent(id: number, payload: Record<string, unknown>): Promise<Event> {
  const weddingDetails: Record<string, unknown> = {}
  for (const field of WEDDING_DETAIL_FIELDS) {
    if (payload[field] !== undefined) weddingDetails[field] = payload[field]
  }
  const eventPayload: Record<string, unknown> = {}
  if (payload.name !== undefined) eventPayload.name = payload.name
  if (payload.description !== undefined) eventPayload.description = payload.description
  if (payload.message !== undefined) eventPayload.message = payload.message
  if (payload.eventDate !== undefined) eventPayload.eventDate = payload.eventDate
  if (payload.startTime !== undefined) eventPayload.startTime = payload.startTime
  if (payload.endTime !== undefined) eventPayload.endTime = payload.endTime
  if (payload.venueName !== undefined) eventPayload.venueName = payload.venueName
  if (payload.venueAddress !== undefined) eventPayload.venueAddress = payload.venueAddress
  if (payload.city !== undefined) eventPayload.city = payload.city
  if (payload.commune !== undefined) eventPayload.commune = payload.commune
  if (payload.country !== undefined) eventPayload.country = payload.country
  if (payload.latitude !== undefined) eventPayload.latitude = payload.latitude
  if (payload.longitude !== undefined) eventPayload.longitude = payload.longitude
  if (payload.mapUrl !== undefined) eventPayload.mapUrl = payload.mapUrl
  if (Object.keys(weddingDetails).length > 0) eventPayload.weddingDetails = weddingDetails
  const res = await http.put(`${ApiConfig.eventsPath}/${id}`, eventPayload)
  return parseEvent(decodeMap(res.data))
}

export async function updateEventStatus(id: number, status: string): Promise<Event> {
  const res = await http.patch(`${ApiConfig.eventsPath}/${id}/status`, { status })
  return parseEvent(decodeMap(res.data))
}

export async function deleteEvent(id: number): Promise<void> {
  await http.delete(`${ApiConfig.eventsPath}/${id}`)
}
