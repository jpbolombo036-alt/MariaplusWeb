import { http, decodeMap } from './http'
import { ApiConfig } from './config'

export interface PublicInvitation {
  guestFirstName?: string | null
  guestLastName?: string | null
  weddingDisplayName?: string | null
  couplePhotoUrl?: string | null
  message?: string | null
  eventName?: string | null
  eventDate?: string | null
  eventStartTime?: string | null
  eventVenue?: string | null
  maxAccepted?: number | null
  status: string
  rsvpStatus?: string | null
  rsvpNumberOfAttendees?: number | null
}

export interface PublicRsvp {
  invitationStatus: string
  rsvpStatus: string
  numberOfAttendees: number
}

export async function getPublicInvitation(token: string): Promise<PublicInvitation> {
  const res = await http.get(`${ApiConfig.publicInvitationsPath}/${token}`)
  const j = decodeMap(res.data)
  return {
    guestFirstName: j.guestFirstName ? String(j.guestFirstName) : null,
    guestLastName: j.guestLastName ? String(j.guestLastName) : null,
    weddingDisplayName: j.weddingDisplayName ? String(j.weddingDisplayName) : null,
    couplePhotoUrl: j.couplePhotoUrl ? String(j.couplePhotoUrl) : null,
    message: j.message ? String(j.message) : null,
    eventName: j.eventName ? String(j.eventName) : null,
    eventDate: j.eventDate ? String(j.eventDate) : null,
    eventStartTime: j.eventStartTime ? String(j.eventStartTime) : null,
    eventVenue: j.eventVenue ? String(j.eventVenue) : null,
    maxAccepted: j.maxAccepted != null ? Number(j.maxAccepted) : null,
    status: String(j.status ?? ''),
    rsvpStatus: j.rsvpStatus ? String(j.rsvpStatus) : null,
    rsvpNumberOfAttendees: j.rsvpNumberOfAttendees != null ? Number(j.rsvpNumberOfAttendees) : null,
  }
}

export async function submitPublicRsvp(token: string, status: string, attendees: number): Promise<PublicRsvp> {
  const res = await http.post(`${ApiConfig.publicInvitationsPath}/${token}/rsvp`, {
    status,
    numberOfAttendees: attendees,
  })
  const j = decodeMap(res.data)
  return {
    invitationStatus: String(j.invitationStatus ?? ''),
    rsvpStatus: String(j.rsvpStatus ?? ''),
    numberOfAttendees: Number(j.numberOfAttendees ?? 0),
  }
}