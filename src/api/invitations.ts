import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface Invitation {
  id: number
  weddingId: number
  guestId: number
  invitationCode: string
  status: string
  sentAt?: string | null
  lastSentAt?: string | null
  reminderCount: number
  openedAt?: string | null
}

export interface SendResult {
  status?: string
  emailSent?: boolean
  publicInviteUrl?: string
}

export interface QrCode {
  dataUri: string
}

function parseInv(json: Record<string, unknown>): Invitation {
  return {
    id: Number(json.id ?? 0),
    weddingId: Number(json.weddingId ?? 0),
    guestId: Number(json.guestId ?? 0),
    invitationCode: String(json.invitationCode ?? ''),
    status: String(json.status ?? 'DRAFT'),
    sentAt: json.sentAt ? String(json.sentAt) : null,
    lastSentAt: json.lastSentAt ? String(json.lastSentAt) : null,
    reminderCount: Number(json.reminderCount ?? 0),
    openedAt: json.openedAt ? String(json.openedAt) : null,
  }
}

export async function listInvitations(weddingId: number): Promise<Invitation[]> {
  const res = await http.get(ApiConfig.weddingInvitationsPath(weddingId), { params: { size: 200 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseInv(e as Record<string, unknown>))
}

export async function listNonResponders(weddingId: number): Promise<Invitation[]> {
  const res = await http.get(`${ApiConfig.weddingInvitationsPath(weddingId)}/pending-rsvp`)
  return decodeList(res.data).map((e) => parseInv(e as Record<string, unknown>))
}

export async function createInvitation(weddingId: number, guestId: number): Promise<Invitation> {
  const res = await http.post(ApiConfig.weddingInvitationsPath(weddingId), { guestId })
  return parseInv(decodeMap(res.data))
}

export async function updateInvitation(weddingId: number, invitationId: number, payload: Record<string, unknown>): Promise<Invitation> {
  const res = await http.put(`${ApiConfig.weddingInvitationsPath(weddingId)}/${invitationId}`, payload)
  return parseInv(decodeMap(res.data))
}

export async function deleteInvitation(weddingId: number, invitationId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingInvitationsPath(weddingId)}/${invitationId}`)
}

export async function sendInvitation(weddingId: number, invitationId: number): Promise<SendResult> {
  const res = await http.post(`${ApiConfig.weddingInvitationsPath(weddingId)}/${invitationId}/send`)
  return decodeMap(res.data) as unknown as SendResult
}

export async function resendInvitation(weddingId: number, invitationId: number): Promise<SendResult> {
  const res = await http.post(`${ApiConfig.weddingInvitationsPath(weddingId)}/${invitationId}/resend`)
  return decodeMap(res.data) as unknown as SendResult
}

export async function cancelInvitation(weddingId: number, invitationId: number): Promise<Invitation> {
  const res = await http.post(`${ApiConfig.weddingInvitationsPath(weddingId)}/${invitationId}/cancel`)
  return parseInv(decodeMap(res.data))
}

export async function getQr(weddingId: number, invitationId: number): Promise<QrCode> {
  const res = await http.get(`${ApiConfig.weddingInvitationsPath(weddingId)}/${invitationId}/qr`)
  return { dataUri: String(decodeMap(res.data).qrDataUri ?? '') }
}

export async function rotateQr(weddingId: number, invitationId: number): Promise<QrCode> {
  const res = await http.post(`${ApiConfig.weddingInvitationsPath(weddingId)}/${invitationId}/qr/rotate`)
  return { dataUri: String(decodeMap(res.data).qrDataUri ?? '') }
}
