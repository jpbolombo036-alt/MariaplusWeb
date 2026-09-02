import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

/**
 * Affectation invité ↔ table. Un invité a au plus une affectation active.
 * Les endpoints correspondent à TableAssignmentController / WeddingTableController
 * (alias /api/events/{eventId}/... et /api/weddings/{weddingId}/...).
 */
export interface TableAssignment {
  assignmentId: number
  guestId: number
  guestName: string
  tableId: number
  tableName: string
  assignedAt?: string | null
}

function parseAssignment(json: Record<string, unknown>): TableAssignment {
  return {
    assignmentId: Number(json.assignmentId ?? json.id ?? 0),
    guestId: Number(json.guestId ?? 0),
    guestName: String(json.guestName ?? ''),
    tableId: Number(json.tableId ?? 0),
    tableName: String(json.tableName ?? ''),
    assignedAt: json.assignedAt ? String(json.assignedAt) : null,
  }
}

/** Liste toutes les affectations (placement) d'un événement. */
export async function listAssignments(eventId: number): Promise<TableAssignment[]> {
  const res = await http.get(ApiConfig.weddingAssignmentsPath(eventId))
  return decodeList(res.data).map((e) => parseAssignment(e as Record<string, unknown>))
}

/** Affecte un invité à une table (409 si l'invité est déjà placé ou table pleine). */
export async function assignGuest(eventId: number, tableId: number, guestId: number): Promise<TableAssignment> {
  const res = await http.post(`${ApiConfig.weddingTablesPath(eventId)}/${tableId}/assignments`, { guestId })
  return parseAssignment(decodeMap(res.data))
}

/** Déplace une affectation existante vers une autre table. */
export async function moveAssignment(eventId: number, assignmentId: number, tableId: number): Promise<TableAssignment> {
  const res = await http.put(`${ApiConfig.weddingAssignmentsPath(eventId)}/${assignmentId}`, { tableId })
  return parseAssignment(decodeMap(res.data))
}

/** Retire un invité de sa table (capacité libérée). */
export async function removeAssignment(eventId: number, assignmentId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingAssignmentsPath(eventId)}/${assignmentId}`)
}