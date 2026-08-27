import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface WeddingTable {
  id: number
  name: string
  description?: string | null
  capacity: number
  assignedCount: number
  remainingCapacity: number
}

function parseTable(json: Record<string, unknown>): WeddingTable {
  return {
    id: Number(json.id ?? 0),
    name: String(json.name ?? ''),
    description: json.description ? String(json.description) : null,
    capacity: Number(json.capacity ?? 0),
    assignedCount: Number(json.assignedCount ?? 0),
    remainingCapacity: Number(json.remainingCapacity ?? 0),
  }
}

export async function listTables(weddingId: number): Promise<WeddingTable[]> {
  const res = await http.get(ApiConfig.weddingTablesPath(weddingId))
  return decodeList(res.data).map((e) => parseTable(e as Record<string, unknown>))
}

export async function createTable(weddingId: number, name: string, capacity: number): Promise<WeddingTable> {
  const res = await http.post(ApiConfig.weddingTablesPath(weddingId), { name, capacity })
  return parseTable(decodeMap(res.data))
}

export async function deleteTable(weddingId: number, tableId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingTablesPath(weddingId)}/${tableId}`)
}
