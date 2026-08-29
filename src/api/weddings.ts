import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface Wedding {
  id: number
  organizationId: number
  groomFirstName: string
  groomLastName: string
  brideFirstName: string
  brideLastName: string
  groomPhotoUrl?: string | null
  bridePhotoUrl?: string | null
  couplePhotoUrl?: string | null
  description?: string | null
  welcomeMessage?: string | null
  status: string
  displayName: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface PageData<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

/**
 * Bascule Event (racine unifiée) : le backend sert désormais les mariages via
 * /api/events (type = WEDDING, détails imbriqués dans weddingDetails).
 * Cette couche conserve l'interface `Wedding` pour les composants existants
 * et traduit les payloads vers/depuis le nouveau format Event.
 */

/** Construit le nom d'affichage de l'événement à partir des prénoms/noms. */
function buildEventName(p: Record<string, unknown>): string {
  const groom = `${p.groomFirstName ?? ''} ${p.groomLastName ?? ''}`.trim()
  const bride = `${p.brideFirstName ?? ''} ${p.brideLastName ?? ''}`.trim()
  return `${groom} & ${bride}`.trim() || 'Mariage'
}

/** Champs spécifiques au mariage (imbriqués dans weddingDetails côté API). */
const WEDDING_DETAIL_FIELDS = [
  'groomFirstName', 'groomLastName', 'brideFirstName', 'brideLastName',
  'groomPhotoUrl', 'bridePhotoUrl', 'couplePhotoUrl', 'welcomeMessage',
] as const

export function parseWedding(json: Record<string, unknown>): Wedding {
  const details = (json.weddingDetails ?? {}) as Record<string, unknown>
  return {
    id: Number(json.id ?? 0),
    organizationId: Number(json.organizationId ?? 0),
    groomFirstName: String(details.groomFirstName ?? ''),
    groomLastName: String(details.groomLastName ?? ''),
    brideFirstName: String(details.brideFirstName ?? ''),
    brideLastName: String(details.brideLastName ?? ''),
    groomPhotoUrl: details.groomPhotoUrl ? String(details.groomPhotoUrl) : null,
    bridePhotoUrl: details.bridePhotoUrl ? String(details.bridePhotoUrl) : null,
    couplePhotoUrl: details.couplePhotoUrl ? String(details.couplePhotoUrl) : null,
    description: json.description ? String(json.description) : null,
    welcomeMessage: details.welcomeMessage ? String(details.welcomeMessage) : null,
    status: String(json.status ?? 'DRAFT'),
    displayName: String(details.displayName ?? json.name ?? ''),
    createdAt: json.createdAt ? String(json.createdAt) : null,
    updatedAt: json.updatedAt ? String(json.updatedAt) : null,
  }
}

export async function listWeddings(page = 0, size = 25): Promise<Wedding[]> {
  const res = await http.get(ApiConfig.weddingsPath, { params: { page, size } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseWedding(e as Record<string, unknown>))
}

export async function getWedding(id: number): Promise<Wedding> {
  const res = await http.get(`${ApiConfig.weddingsPath}/${id}`)
  return parseWedding(decodeMap(res.data))
}

export async function createWedding(payload: Record<string, unknown>): Promise<Wedding> {
  const weddingDetails: Record<string, unknown> = {}
  for (const field of WEDDING_DETAIL_FIELDS) {
    if (payload[field] !== undefined) weddingDetails[field] = payload[field]
  }
  const eventPayload: Record<string, unknown> = {
    name: buildEventName(payload),
    type: 'WEDDING',
    weddingDetails,
  }
  if (payload.description !== undefined) eventPayload.description = payload.description
  if (payload.message !== undefined) eventPayload.message = payload.message
  const res = await http.post(ApiConfig.weddingsPath, eventPayload)
  return parseWedding(decodeMap(res.data))
}

export async function updateWedding(id: number, payload: Record<string, unknown>): Promise<Wedding> {
  const weddingDetails: Record<string, unknown> = {}
  for (const field of WEDDING_DETAIL_FIELDS) {
    if (payload[field] !== undefined) weddingDetails[field] = payload[field]
  }
  const eventPayload: Record<string, unknown> = {}
  if (payload.name !== undefined) eventPayload.name = payload.name
  if (payload.description !== undefined) eventPayload.description = payload.description
  if (payload.message !== undefined) eventPayload.message = payload.message
  if (Object.keys(weddingDetails).length > 0) eventPayload.weddingDetails = weddingDetails
  const res = await http.put(`${ApiConfig.weddingsPath}/${id}`, eventPayload)
  return parseWedding(decodeMap(res.data))
}

export async function updateWeddingStatus(id: number, status: string): Promise<Wedding> {
  const res = await http.patch(`${ApiConfig.weddingsPath}/${id}/status`, { status })
  return parseWedding(decodeMap(res.data))
}

export async function deleteWedding(id: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingsPath}/${id}`)
}
