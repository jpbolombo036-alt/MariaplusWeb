import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface Guest {
  id: number
  weddingId: number
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
  weddingId: number
  name: string
  description?: string | null
  active: boolean
}

function parseGuest(json: Record<string, unknown>): Guest {
  return {
    id: Number(json.id ?? 0),
    weddingId: Number(json.weddingId ?? 0),
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
    weddingId: Number(json.weddingId ?? 0),
    name: String(json.name ?? ''),
    description: json.description ? String(json.description) : null,
    active: Boolean(json.active ?? true),
  }
}

export async function listGuests(weddingId: number): Promise<Guest[]> {
  const res = await http.get(ApiConfig.weddingGuestsPath(weddingId), { params: { size: 200 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseGuest(e as Record<string, unknown>))
}

export async function createGuest(weddingId: number, payload: Record<string, unknown>): Promise<Guest> {
  const res = await http.post(ApiConfig.weddingGuestsPath(weddingId), payload)
  return parseGuest(decodeMap(res.data))
}

export async function deleteGuest(weddingId: number, guestId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingGuestsPath(weddingId)}/${guestId}`)
}

export async function listCategories(weddingId: number): Promise<GuestCategory[]> {
  const res = await http.get(ApiConfig.weddingCategoriesPath(weddingId), { params: { size: 100 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseCategory(e as Record<string, unknown>))
}

export async function createCategory(weddingId: number, name: string, description?: string): Promise<GuestCategory> {
  const res = await http.post(ApiConfig.weddingCategoriesPath(weddingId), { name, description: description || null })
  return parseCategory(decodeMap(res.data))
}

export async function updateCategory(
  weddingId: number,
  categoryId: number,
  payload: Record<string, unknown>,
): Promise<GuestCategory> {
  const res = await http.put(`${ApiConfig.weddingCategoriesPath(weddingId)}/${categoryId}`, payload)
  return parseCategory(decodeMap(res.data))
}

export async function deleteCategory(weddingId: number, categoryId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingCategoriesPath(weddingId)}/${categoryId}`)
}

export async function updateGuest(weddingId: number, guestId: number, payload: Record<string, unknown>): Promise<Guest> {
  const res = await http.put(`${ApiConfig.weddingGuestsPath(weddingId)}/${guestId}`, payload)
  return parseGuest(decodeMap(res.data))
}
