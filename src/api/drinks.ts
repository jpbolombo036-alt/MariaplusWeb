import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface Drink {
  id: number
  weddingId: number
  name: string
  description?: string | null
  displayOrder?: number | null
  active: boolean
}

export interface CreateDrinkRequest {
  name: string
  description?: string
  displayOrder?: number
}

export interface UpdateDrinkRequest {
  name?: string
  description?: string
  displayOrder?: number
  active?: boolean
}

export async function listDrinks(eventId: number): Promise<Drink[]> {
  const res = await http.get(`${ApiConfig.weddingDrinksPath(eventId)}`, { params: { size: 200 } })
  const json = decodeMap(res.data)
  return (decodeList(json.content) as Record<string, unknown>[]).map((e) => ({
    id: Number(e.id ?? 0),
    weddingId: Number(e.weddingId ?? 0),
    name: String(e.name ?? ''),
    description: e.description ? String(e.description) : null,
    displayOrder: e.displayOrder != null ? Number(e.displayOrder) : null,
    active: Boolean(e.active ?? true),
  }))
}

export async function createDrink(eventId: number, payload: CreateDrinkRequest): Promise<Drink> {
  const res = await http.post(`${ApiConfig.weddingDrinksPath(eventId)}`, payload)
  const j = decodeMap(res.data)
  return {
    id: Number(j.id ?? 0),
    weddingId: Number(j.weddingId ?? eventId),
    name: String(j.name ?? ''),
    description: j.description ? String(j.description) : null,
    displayOrder: j.displayOrder != null ? Number(j.displayOrder) : null,
    active: Boolean(j.active ?? true),
  }
}

export async function updateDrink(eventId: number, drinkId: number, payload: UpdateDrinkRequest): Promise<Drink> {
  const res = await http.put(`${ApiConfig.weddingDrinksPath(eventId)}/${drinkId}`, payload)
  const j = decodeMap(res.data)
  return {
    id: Number(j.id ?? drinkId),
    weddingId: Number(j.weddingId ?? eventId),
    name: String(j.name ?? ''),
    description: j.description ? String(j.description) : null,
    displayOrder: j.displayOrder != null ? Number(j.displayOrder) : null,
    active: Boolean(j.active ?? true),
  }
}

export async function deleteDrink(eventId: number, drinkId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingDrinksPath(eventId)}/${drinkId}`)
}
