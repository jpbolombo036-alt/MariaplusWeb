import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

/** Boisson du CATALOGUE GLOBAL (superadmin). */
export interface CatalogDrink {
  id: number
  name: string
  description?: string | null
  displayOrder?: number | null
  active: boolean
  imageUrl?: string | null
}

const basePath = '/api/admin/drink-catalog'

function parse(json: Record<string, unknown>): CatalogDrink {
  return {
    id: Number(json.id ?? 0),
    name: String(json.name ?? ''),
    description: json.description ? String(json.description) : null,
    displayOrder: json.displayOrder != null ? Number(json.displayOrder) : null,
    active: Boolean(json.active ?? true),
    imageUrl: json.imageUrl ? String(json.imageUrl) : null,
  }
}

/** Catalogue complet (superadmin). */
export async function listCatalog(): Promise<CatalogDrink[]> {
  const res = await http.get(basePath)
  return (decodeList(res.data) as Record<string, unknown>[]).map(parse)
}

export async function createCatalogDrink(payload: { name: string; description?: string; displayOrder?: number }): Promise<CatalogDrink> {
  const res = await http.post(basePath, payload)
  return parse(decodeMap(res.data))
}

export async function updateCatalogDrink(id: number, payload: { name: string; description?: string; displayOrder?: number }): Promise<CatalogDrink> {
  const res = await http.put(`${basePath}/${id}`, payload)
  return parse(decodeMap(res.data))
}

export async function setCatalogDrinkActive(id: number, active: boolean): Promise<CatalogDrink> {
  const res = await http.patch(`${basePath}/${id}/active`, { active })
  return parse(decodeMap(res.data))
}

export async function deleteCatalogDrink(id: number): Promise<void> {
  await http.delete(`${basePath}/${id}`)
}

/** Upload / remplace la photo (multipart). */
export async function uploadCatalogImage(id: number, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await http.put(`${basePath}/${id}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export async function deleteCatalogImage(id: number): Promise<void> {
  await http.delete(`${basePath}/${id}/image`)
}

/** URL absolue d'une photo du catalogue (chemins relatifs → base API). */
export function catalogImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:')) return url
  return url.startsWith('/') ? `${ApiConfig.baseUrl}${url}` : url
}

/* ============================================================
 * Réglage « création d'événements » (SUPER_ADMIN)
 * ============================================================ */

/** État de l'interrupteur (SUPER_ADMIN — page Paramètres). */
export async function getEventCreationSetting(): Promise<boolean> {
  const res = await http.get('/api/admin/settings/event-creation')
  return Boolean(decodeMap(res.data).eventCreationEnabled ?? true)
}

/** Autorise / interdit la création d'événements pour les utilisateurs (SUPER_ADMIN). */
export async function updateEventCreationSetting(enabled: boolean): Promise<boolean> {
  const res = await http.put('/api/admin/settings/event-creation', { enabled })
  return Boolean(decodeMap(res.data).eventCreationEnabled ?? enabled)
}
