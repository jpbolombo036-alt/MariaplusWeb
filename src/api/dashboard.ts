import { http, decodeMap } from './http'
import { ApiConfig } from './config'

export interface Dashboard {
  weddingId: number
  guests: { total: number; unassigned?: number }
  invitations: { total: number; accepted: number; declined: number; pending: number; responseRate: number }
  attendance: { expected: number; checkedIn: number; remaining: number; checkInRate: number }
  tables: { total: number; capacity: number; assignedGuests: number; remainingCapacity: number }
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

export async function getDashboard(weddingId: number): Promise<Dashboard> {
  const res = await http.get(ApiConfig.weddingDashboardPath(weddingId))
  const json = decodeMap(res.data)
  const g = (json.guests as Record<string, unknown>) ?? {}
  const i = (json.invitations as Record<string, unknown>) ?? {}
  const a = (json.attendance as Record<string, unknown>) ?? {}
  const t = (json.tables as Record<string, unknown>) ?? {}
  return {
    weddingId: num(json.weddingId),
    guests: { total: num(g.total), unassigned: num(g.unassigned) },
    invitations: {
      total: num(i.total),
      accepted: num(i.accepted),
      declined: num(i.declined),
      pending: num(i.pending),
      responseRate: num(i.responseRate),
    },
    attendance: {
      expected: num(a.expected),
      checkedIn: num(a.checkedIn),
      remaining: num(a.remaining),
      checkInRate: num(a.checkInRate),
    },
    tables: {
      total: num(t.total),
      capacity: num(t.capacity),
      assignedGuests: num(t.assignedGuests),
      remainingCapacity: num(t.remainingCapacity),
    },
  }
}
