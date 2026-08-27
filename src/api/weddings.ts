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

export function parseWedding(json: Record<string, unknown>): Wedding {
  return {
    id: Number(json.id ?? 0),
    organizationId: Number(json.organizationId ?? 0),
    groomFirstName: String(json.groomFirstName ?? ''),
    groomLastName: String(json.groomLastName ?? ''),
    brideFirstName: String(json.brideFirstName ?? ''),
    brideLastName: String(json.brideLastName ?? ''),
    groomPhotoUrl: json.groomPhotoUrl ? String(json.groomPhotoUrl) : null,
    bridePhotoUrl: json.bridePhotoUrl ? String(json.bridePhotoUrl) : null,
    couplePhotoUrl: json.couplePhotoUrl ? String(json.couplePhotoUrl) : null,
    description: json.description ? String(json.description) : null,
    welcomeMessage: json.welcomeMessage ? String(json.welcomeMessage) : null,
    status: String(json.status ?? 'DRAFT'),
    displayName: String(json.displayName ?? ''),
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
  const res = await http.post(ApiConfig.weddingsPath, payload)
  return parseWedding(decodeMap(res.data))
}

export async function updateWedding(id: number, payload: Record<string, unknown>): Promise<Wedding> {
  const res = await http.put(`${ApiConfig.weddingsPath}/${id}`, payload)
  return parseWedding(decodeMap(res.data))
}

export async function updateWeddingStatus(id: number, status: string): Promise<Wedding> {
  const res = await http.patch(`${ApiConfig.weddingsPath}/${id}/status`, { status })
  return parseWedding(decodeMap(res.data))
}

export async function deleteWedding(id: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingsPath}/${id}`)
}
