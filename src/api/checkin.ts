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
}

export interface CheckInResult {
  checkInId: number
  guestName: string
  numberOfAttendees: number
  remainingAttendees: number
}

export async function scan(qrToken: string, weddingId: number): Promise<CheckInScan> {
  const res = await http.post(`${ApiConfig.checkinsPath}/scan`, { qrToken, weddingId })
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
  }
}

export async function checkIn(qrToken: string, weddingId: number, numberOfAttendees: number): Promise<CheckInResult> {
  const res = await http.post(ApiConfig.checkinsPath, { qrToken, weddingId, numberOfAttendees })
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
