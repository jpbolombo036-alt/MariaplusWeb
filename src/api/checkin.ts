import { http, decodeMap } from './http'
import { ApiConfig } from './config'

export interface CheckInScan {
  guestName: string
  weddingDisplayName: string
  invitationStatus: string
  rsvpStatus?: string | null
  expectedAttendees: number
  checkedInAttendees: number
  remainingAttendees: number
  canCheckIn: boolean
  tableName?: string | null
  drinkChoice?: string | null
}

export interface CheckInResult {
  checkInId: number
  guestName: string
  numberOfAttendees: number
  remainingAttendees: number
}

export async function scan(qrToken: string, eventId: number): Promise<CheckInScan> {
  // Le backend (ScanCheckInRequest) attend le champ weddingId (même sémantique
  // que l'événement actif côté front).
  const res = await http.post(`${ApiConfig.checkinsPath}/scan`, { qrToken, weddingId: eventId })
  const j = decodeMap(res.data)
  return {
    guestName: String(j.guestName ?? ''),
    weddingDisplayName: String(j.weddingDisplayName ?? ''),
    invitationStatus: String(j.invitationStatus ?? ''),
    rsvpStatus: j.rsvpStatus ? String(j.rsvpStatus) : null,
    expectedAttendees: Number(j.expectedAttendees ?? 0),
    checkedInAttendees: Number(j.checkedInAttendees ?? 0),
    remainingAttendees: Number(j.remainingAttendees ?? 0),
    canCheckIn: Boolean(j.canCheckIn),
    tableName: typeof j.tableName === 'string' ? j.tableName : null,
    drinkChoice: typeof j.drinkChoice === 'string' ? j.drinkChoice : null,
  }
}

export async function checkIn(qrToken: string, eventId: number, numberOfAttendees: number): Promise<CheckInResult> {
  // CheckInRequest attend aussi weddingId.
  const res = await http.post(ApiConfig.checkinsPath, { qrToken, weddingId: eventId, numberOfAttendees })
  const j = decodeMap(res.data)
  return {
    checkInId: Number(j.checkInId ?? 0),
    guestName: String(j.guestName ?? ''),
    numberOfAttendees: Number(j.numberOfAttendees ?? 0),
    remainingAttendees: Number(j.remainingAttendees ?? 0),
  }
}

export async function cancelCheckIn(checkInId: number): Promise<void> {
  await http.delete(`${ApiConfig.checkinsPath}/${checkInId}`)
}

export interface PresentGuest {
  invitationId: number
  guestId: number
  guestName: string
  numberOfAttendees: number
  lastCheckedInAt: string | null
  tableName?: string | null
  drinkChoice?: string | null
}

export async function listPresent(eventId: number): Promise<PresentGuest[]> {
  const res = await http.get(`${ApiConfig.checkinsPath}/event/${eventId}`)
  if (!Array.isArray(res.data)) return []
  return res.data.map((j: any) => ({
    invitationId: Number(j.invitationId ?? 0),
    guestId: Number(j.guestId ?? 0),
    guestName: String(j.guestName ?? ''),
    numberOfAttendees: Number(j.numberOfAttendees ?? 0),
    lastCheckedInAt: typeof j.lastCheckedInAt === 'string' ? j.lastCheckedInAt : null,
    tableName: typeof j.tableName === 'string' ? j.tableName : null,
    drinkChoice: typeof j.drinkChoice === 'string' ? j.drinkChoice : null,
  }))
}
