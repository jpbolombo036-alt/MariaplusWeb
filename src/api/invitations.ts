import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'

export interface Invitation {
  id: number
  eventId: number
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
    eventId: Number(json.eventId ?? json.weddingId ?? 0),
    guestId: Number(json.guestId ?? 0),
    invitationCode: String(json.invitationCode ?? ''),
    status: String(json.status ?? 'DRAFT'),
    sentAt: json.sentAt ? String(json.sentAt) : null,
    lastSentAt: json.lastSentAt ? String(json.lastSentAt) : null,
    reminderCount: Number(json.reminderCount ?? 0),
    openedAt: json.openedAt ? String(json.openedAt) : null,
  }
}

export async function listInvitations(eventId: number): Promise<Invitation[]> {
  const res = await http.get(ApiConfig.weddingInvitationsPath(eventId), { params: { size: 200 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseInv(e as Record<string, unknown>))
}

export async function listNonResponders(eventId: number): Promise<Invitation[]> {
  const res = await http.get(`${ApiConfig.weddingInvitationsPath(eventId)}/pending-rsvp`)
  return decodeList(res.data).map((e) => parseInv(e as Record<string, unknown>))
}

export async function createInvitation(eventId: number, guestId: number): Promise<Invitation> {
  const res = await http.post(ApiConfig.weddingInvitationsPath(eventId), { guestId })
  return parseInv(decodeMap(res.data))
}

export async function updateInvitation(eventId: number, invitationId: number, payload: Record<string, unknown>): Promise<Invitation> {
  const res = await http.put(`${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}`, payload)
  return parseInv(decodeMap(res.data))
}

export async function deleteInvitation(eventId: number, invitationId: number): Promise<void> {
  await http.delete(`${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}`)
}

export async function sendInvitation(eventId: number, invitationId: number): Promise<SendResult> {
  const res = await http.post(`${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}/send`)
  return normalizeSendResult(decodeMap(res.data) as unknown as SendResult)
}

export async function resendInvitation(eventId: number, invitationId: number): Promise<SendResult> {
  const res = await http.post(`${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}/resend`)
  return normalizeSendResult(decodeMap(res.data) as unknown as SendResult)
}

/**
 * Si le backend n'a pas encore FRONTEND_URL configuré (ou ancien déploiement),
 * il peut renvoyer un lien "localhost" inutilisable par l'invité. On reconstruit
 * alors le lien à partir du domaine sur lequel l'organisateur se trouve.
 */
function normalizeSendResult(r: SendResult): SendResult {
  const url = r.publicInviteUrl
  if (!url) return r
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1')
  if (!isLocal) return r
  const marker = '/invitations/'
  const idx = url.indexOf(marker)
  const token = idx >= 0 ? url.slice(idx + marker.length).split('?')[0] : ''
  r.publicInviteUrl = `${window.location.origin}/invitations/${token}`
  return r
}

export async function cancelInvitation(eventId: number, invitationId: number): Promise<Invitation> {
  const res = await http.post(`${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}/cancel`)
  return parseInv(decodeMap(res.data))
}

export async function getQr(eventId: number, invitationId: number): Promise<QrCode> {
  const res = await http.get(`${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}/qr`)
  return { dataUri: String(decodeMap(res.data).qrDataUri ?? '') }
}

export async function rotateQr(eventId: number, invitationId: number): Promise<QrCode> {
  const res = await http.post(`${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}/qr/rotate`)
  return { dataUri: String(decodeMap(res.data).qrDataUri ?? '') }
}

// ————— Envoi en masse (WhatsApp, batch asynchrone) —————

export interface BulkSendBatch {
  id: number
  weddingId: number
  channel: string
  status: string
  totalCount: number
  sentCount: number
  failedCount: number
  skippedCount: number
  createdAt?: string | null
}

export interface NotificationLog {
  id: number
  invitationId?: number | null
  guestId?: number | null
  channel: string
  status: string
  errorMessage?: string | null
  createdAt?: string | null
}

export interface BulkSendOptions {
  /** Cibler une seule catégorie d'invités. */
  categoryId?: number | null
  /** Cibler des invitations précises. */
  invitationIds?: number[] | null
  /** Relancer des invitations déjà envoyées (plafonné côté serveur). */
  resend?: boolean
  /** Relancer uniquement les invitations sans réponse RSVP. */
  onlyPendingRsvp?: boolean
}

function parseBatch(json: Record<string, unknown>): BulkSendBatch {
  return {
    id: Number(json.id ?? 0),
    weddingId: Number(json.weddingId ?? 0),
    channel: String(json.channel ?? 'WHATSAPP'),
    status: String(json.status ?? 'PENDING'),
    totalCount: Number(json.totalCount ?? 0),
    sentCount: Number(json.sentCount ?? 0),
    failedCount: Number(json.failedCount ?? 0),
    skippedCount: Number(json.skippedCount ?? 0),
    createdAt: json.createdAt ? String(json.createdAt) : null,
  }
}

function parseLog(json: Record<string, unknown>): NotificationLog {
  return {
    id: Number(json.id ?? 0),
    invitationId: json.invitationId != null ? Number(json.invitationId) : null,
    guestId: json.guestId != null ? Number(json.guestId) : null,
    channel: String(json.channel ?? 'WHATSAPP'),
    status: String(json.status ?? ''),
    errorMessage: json.errorMessage ? String(json.errorMessage) : null,
    createdAt: json.createdAt ? String(json.createdAt) : null,
  }
}

/** Démarre un envoi en masse (répond 202 + batch à suivre). */
export async function startBulkSend(eventId: number, opts: BulkSendOptions = {}): Promise<BulkSendBatch> {
  const res = await http.post(ApiConfig.weddingBulkSendPath(eventId), {
    channel: 'WHATSAPP',
    categoryId: opts.categoryId ?? null,
    invitationIds: opts.invitationIds ?? null,
    resend: opts.resend ?? false,
    onlyPendingRsvp: opts.onlyPendingRsvp ?? false,
  })
  return parseBatch(decodeMap(res.data))
}

/** État d'avancement d'un batch. */
export async function getBulkBatch(eventId: number, batchId: number): Promise<BulkSendBatch> {
  const res = await http.get(`${ApiConfig.weddingBulkSendPath(eventId)}/${batchId}`)
  return parseBatch(decodeMap(res.data))
}

/** Détail par invitation (statut + raison d'échec éventuelle). */
export async function getBulkBatchLogs(eventId: number, batchId: number): Promise<NotificationLog[]> {
  const res = await http.get(`${ApiConfig.weddingBulkSendPath(eventId)}/${batchId}/logs`, { params: { size: 200 } })
  const json = decodeMap(res.data)
  return decodeList(json.content).map((e) => parseLog(e as Record<string, unknown>))
}
