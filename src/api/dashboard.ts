import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface Dashboard {
  eventId: number
  eventName?: string
  guests: { total: number; unassigned?: number }
  invitations: { total: number; accepted: number; declined: number; pending: number; responseRate: number }
  attendance: { expected: number; checkedIn: number; remaining: number; checkInRate: number }
  tables: { total: number; capacity: number; assignedGuests: number; remainingCapacity: number }
}

export interface UpcomingSession {
  id: number
  name?: string | null
  type?: string | null
  sessionDate?: string | null
  startTime?: string | null
  endTime?: string | null
  venueName?: string | null
  city?: string | null
  expectedAttendees?: number | null
}

export interface ActivityItem {
  id: number
  action: string
  entityType?: string | null
  entityId?: number | null
  details?: string | null
  performedAt: string
  userId?: number | null
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

export async function getDashboard(eventId: number): Promise<Dashboard> {
  const res = await http.get(ApiConfig.weddingDashboardPath(eventId))
  const json = decodeMap(res.data)
  const g = (json.guests as Record<string, unknown>) ?? {}
  const i = (json.invitations as Record<string, unknown>) ?? {}
  const a = (json.attendance as Record<string, unknown>) ?? {}
  const t = (json.tables as Record<string, unknown>) ?? {}
  return {
    eventId: num(json.eventId ?? json.weddingId),
    eventName: typeof json.eventName === 'string' ? json.eventName : (typeof json.weddingName === 'string' ? json.weddingName : undefined),
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

/** Prochaine session de l'événement (204 => null). */
export async function getUpcomingSession(eventId: number): Promise<UpcomingSession | null> {
  try {
    const res = await http.get(`${ApiConfig.weddingDashboardPath(eventId)}/upcoming-session`)
    const json = decodeMap(res.data)
    return {
      id: num(json.id),
      name: typeof json.name === 'string' ? json.name : null,
      type: typeof json.type === 'string' ? json.type : null,
      sessionDate: typeof json.sessionDate === 'string' ? json.sessionDate : null,
      startTime: typeof json.startTime === 'string' ? json.startTime : null,
      endTime: typeof json.endTime === 'string' ? json.endTime : null,
      venueName: typeof json.venueName === 'string' ? json.venueName : null,
      city: typeof json.city === 'string' ? json.city : null,
      expectedAttendees: json.expectedAttendees != null ? num(json.expectedAttendees) : null,
    }
  } catch {
    // Pas de session à venir (204) ou accès restreint : la carte restera vide.
    return null
  }
}

/** Activité récente de l'organisation (traces d'audit réelles). */
export async function getRecentActivity(eventId: number, limit = 8): Promise<ActivityItem[]> {
  const res = await http.get(`${ApiConfig.weddingDashboardPath(eventId)}/recent-activity`, { params: { limit } })
  const list = decodeList(res.data)
  return list.map((raw) => {
    const j = (raw ?? {}) as Record<string, unknown>
    return {
      id: num(j.id),
      action: typeof j.action === 'string' ? j.action : '',
      entityType: typeof j.entityType === 'string' ? j.entityType : null,
      entityId: j.entityId != null ? num(j.entityId) : null,
      details: typeof j.details === 'string' ? j.details : null,
      performedAt: typeof j.performedAt === 'string' ? j.performedAt : '',
      userId: j.userId != null ? num(j.userId) : null,
    }
  })
}
