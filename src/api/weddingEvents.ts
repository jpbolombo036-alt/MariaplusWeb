import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface WeddingEventItem {
  id: number
  weddingId: number
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

export function parseWeddingEvent(json: Record<string, unknown>): WeddingEventItem {
  return {
    id: Number(json.id ?? 0),
    weddingId: Number(json.weddingId ?? 0),
    type: String(json.type ?? 'OTHER'),
    name: String(json.name ?? ''),
    description: str(json.description),
    eventDate: str(json.eventDate),
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

export async function listWeddingEvents(weddingId: number): Promise<WeddingEventItem[]> {
  const res = await http.get(ApiConfig.weddingEventsPath(weddingId), { params: { size: 100 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseWeddingEvent(e as Record<string, unknown>))
}

export async function createWeddingEvent(weddingId: number, payload: Record<string, unknown>): Promise<WeddingEventItem> {
  const res = await http.post(ApiConfig.weddingEventsPath(weddingId), payload)
  return parseWeddingEvent(decodeMap(res.data))
}

export async function updateWeddingEvent(
  weddingId: number,
  eventId: number,
  payload: Record<string, unknown>,
): Promise<WeddingEventItem> {
  const res = await http.put(`${ApiConfig.weddingEventsPath(weddingId)}/${eventId}`, payload)
  return parseWeddingEvent(decodeMap(res.data))
}

export async function deleteWeddingEvent(weddingId: number, eventId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingEventsPath(weddingId)}/${eventId}`)
}
