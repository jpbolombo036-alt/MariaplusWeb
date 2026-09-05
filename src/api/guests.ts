import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface Guest {
  id: number
  eventId: number
  categoryId?: number | null
  firstName: string
  lastName: string
  phone?: string | null
  email?: string | null
  address?: string | null
  allowedCompanions?: number | null
  active: boolean
}

export interface GuestCategory {
  id: number
  eventId: number
  name: string
  description?: string | null
  active: boolean
}

function parseGuest(json: Record<string, unknown>): Guest {
  return {
    id: Number(json.id ?? 0),
    eventId: Number(json.eventId ?? json.weddingId ?? 0),
    categoryId: json.categoryId ? Number(json.categoryId) : null,
    firstName: String(json.firstName ?? ''),
    lastName: String(json.lastName ?? ''),
    phone: json.phone ? String(json.phone) : null,
    email: json.email ? String(json.email) : null,
    address: json.address ? String(json.address) : null,
    allowedCompanions: json.allowedCompanions != null ? Number(json.allowedCompanions) : null,
    active: Boolean(json.active ?? true),
  }
}

function parseCategory(json: Record<string, unknown>): GuestCategory {
  return {
    id: Number(json.id ?? 0),
    eventId: Number(json.eventId ?? json.weddingId ?? 0),
    name: String(json.name ?? ''),
    description: json.description ? String(json.description) : null,
    active: Boolean(json.active ?? true),
  }
}

export async function listGuests(eventId: number): Promise<Guest[]> {
  const res = await http.get(ApiConfig.weddingGuestsPath(eventId), { params: { size: 200 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseGuest(e as Record<string, unknown>))
}

export async function createGuest(eventId: number, payload: Record<string, unknown>): Promise<Guest> {
  const res = await http.post(ApiConfig.weddingGuestsPath(eventId), payload)
  return parseGuest(decodeMap(res.data))
}

export async function deleteGuest(eventId: number, guestId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingGuestsPath(eventId)}/${guestId}`)
}

export async function listCategories(eventId: number): Promise<GuestCategory[]> {
  const res = await http.get(ApiConfig.weddingCategoriesPath(eventId), { params: { size: 100 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseCategory(e as Record<string, unknown>))
}

export async function createCategory(eventId: number, name: string, description?: string): Promise<GuestCategory> {
  const res = await http.post(ApiConfig.weddingCategoriesPath(eventId), { name, description: description || null })
  return parseCategory(decodeMap(res.data))
}

export async function updateCategory(
  eventId: number,
  categoryId: number,
  payload: Record<string, unknown>,
): Promise<GuestCategory> {
  const res = await http.put(`${ApiConfig.weddingCategoriesPath(eventId)}/${categoryId}`, payload)
  return parseCategory(decodeMap(res.data))
}

export async function deleteCategory(eventId: number, categoryId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingCategoriesPath(eventId)}/${categoryId}`)
}

export async function updateGuest(eventId: number, guestId: number, payload: Record<string, unknown>): Promise<Guest> {
  const res = await http.put(`${ApiConfig.weddingGuestsPath(eventId)}/${guestId}`, payload)
  return parseGuest(decodeMap(res.data))
}

export async function exportGuestsCsv(eventId: number): Promise<Blob> {
  const res = await http.get(`${ApiConfig.weddingGuestsPath(eventId)}/export/guests/csv`, { responseType: 'blob' })
  return res.data
}
