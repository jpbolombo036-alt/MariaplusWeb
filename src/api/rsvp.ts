import { http, decodeList } from './http'
import { ApiConfig } from './config'

export interface RsvpRow {
  invitationId: number
  guestId: number
  status?: string | null
  numberOfAttendees?: number | null
  respondedAt?: string | null
  /** Choix de boissons de l'invité (1 à 3) — base des achats avant le jour J. */
  drinkChoices?: string[] | null
}

export async function listRsvps(eventId: number): Promise<RsvpRow[]> {
  const res = await http.get(ApiConfig.weddingRsvpsPath(eventId))
  return decodeList(res.data).map((e) => {
    const j = e as Record<string, unknown>
    return {
      invitationId: Number(j.invitationId ?? 0),
      guestId: Number(j.guestId ?? 0),
      status: j.status ? String(j.status) : null,
      numberOfAttendees: j.numberOfAttendees != null ? Number(j.numberOfAttendees) : null,
      respondedAt: j.respondedAt ? String(j.respondedAt) : null,
      drinkChoices: Array.isArray(j.drinkChoices)
        ? (j.drinkChoices as unknown[]).map((v) => String(v))
        : null,
    }
  })
}
