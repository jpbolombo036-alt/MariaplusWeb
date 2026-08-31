import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface WeddingEventItem {
  id: number
  eventId: number
  type: string
  name: string
  description?: string | null
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
  venueName?: string | null
  venueAddress?: string | null
  city?: string | null
  commune?: string | null
  country?: string | null
  mapUrl?: string | null
  displayOrder?: number | null
  active: boolean
}

function str(v: unknown): string | null {
  return v ? String(v) : null
}
function num(v: unknown): number | null {
  return v != null ? Number(v) : null
}

/**
 * Bascule Event : le backend expose désormais les sous-étapes via
 * /api/events/{eventId}/sessions (EventSession, champ `sessionDate`).
 * L'interface publique garde `eventDate` pour les composants existants.
 */
export function parseWeddingEvent(json: Record<string, unknown>): WeddingEventItem {
  return {
    id: Number(json.id ?? 0),
    eventId: Number(json.eventId ?? json.weddingId ?? 0),
    type: String(json.type ?? 'OTHER'),
    name: String(json.name ?? ''),
    description: str(json.description),
    eventDate: str(json.sessionDate),
    startTime: str(json.startTime),
    endTime: str(json.endTime),
    venueName: str(json.venueName),
    venueAddress: str(json.venueAddress),
    city: str(json.city),
    commune: str(json.commune),
    country: str(json.country),
    mapUrl: str(json.mapUrl),
    displayOrder: num(json.displayOrder),
    active: Boolean(json.active ?? true),
  }
}

/** Traduit un payload `eventDate` → `sessionDate` pour l'API Event. */
function toSessionPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...payload }
  if (out.eventDate !== undefined) {
    out.sessionDate = out.eventDate
    delete out.eventDate
  }
  if (out.weddingId !== undefined) delete out.weddingId
  return out
}

export async function listWeddingEvents(eventId: number): Promise<WeddingEventItem[]> {
  const res = await http.get(ApiConfig.weddingEventsPath(eventId), { params: { size: 100 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseWeddingEvent(e as Record<string, unknown>))
}

export async function createWeddingEvent(eventId: number, payload: Record<string, unknown>): Promise<WeddingEventItem> {
  const res = await http.post(ApiConfig.weddingEventsPath(eventId), toSessionPayload(payload))
  return parseWeddingEvent(decodeMap(res.data))
}

export async function updateWeddingEvent(
  eventId: number,
  sessionId: number,
  payload: Record<string, unknown>,
): Promise<WeddingEventItem> {
  const res = await http.put(`${ApiConfig.weddingEventsPath(eventId)}/${sessionId}`, toSessionPayload(payload))
  return parseWeddingEvent(decodeMap(res.data))
}

export async function deleteWeddingEvent(eventId: number, sessionId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingEventsPath(eventId)}/${sessionId}`)
}
