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
  deliveredAt?: string | null
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
    deliveredAt: json.deliveredAt ? String(json.deliveredAt) : null,
  }
}

export async function listInvitations(eventId: number, opts?: { page?: number; size?: number }): Promise<Invitation[]> {
  const size = opts?.size ?? 500
  const page = opts?.page ?? 0
  const res = await http.get(ApiConfig.weddingInvitationsPath(eventId), { params: { page, size } })
  const json = decodeMap(res.data)
  const items = decodeList(json.content).map((e) => parseInv(e as Record<string, unknown>))
  const totalPages = Number(json.totalPages ?? 1)
  if (opts?.page === undefined && totalPages > 1) {
    const promises: Promise<Invitation[]>[] = []
    for (let p = 1; p < totalPages; p++) {
      promises.push(
        http.get(ApiConfig.weddingInvitationsPath(eventId), { params: { page: p, size } })
          .then((r) => decodeList(decodeMap(r.data).content).map((e) => parseInv(e as Record<string, unknown>)))
      )
    }
    const rest = await Promise.all(promises)
    return items.concat(...rest)
  }
  return items
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
  // `skipNotification` : l'écran Invitations affiche lui-même un message détaillé
  // (et couvre aussi les échecs réseau, que l'intercepteur ne notifie pas).
  const res = await http.post(
    `${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}/send`,
    undefined,
    { skipNotification: true },
  )
  return normalizeSendResult(decodeMap(res.data) as unknown as SendResult)
}

export async function resendInvitation(eventId: number, invitationId: number): Promise<SendResult> {
  const res = await http.post(
    `${ApiConfig.weddingInvitationsPath(eventId)}/${invitationId}/resend`,
    undefined,
    { skipNotification: true },
  )
  return normalizeSendResult(decodeMap(res.data) as unknown as SendResult)
}

/**
 * Si le backend n'a pas encore FRONTEND_URL configuré (ou ancien déploiement),
 * il peut renvoyer un lien "localhost" inutilisable par l'invité. On reconstruit
 * alors le lien à partir d'une origine partageable :
 * - VITE_PUBLIC_BASE_URL si défini (ex. https://eventiaeasy.vercel.app)
 * - sinon l'origine courante (window.location.origin)
 *
 * NB : en développement local (localhost:3000), l'origine courante ne peut pas
 * être ouverte par l'invité sur son téléphone — définissez VITE_PUBLIC_BASE_URL
 * dans .env.local pour que les liens copiés/partagés soient réellement vivants.
 */
function shareableOrigin(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.trim()
  return fromEnv || window.location.origin
}

/**
 * Extrait le jeton public d'un lien d'invitation, quel que soit le format
 * renvoyé par le backend :
 * - `https://domaine/invitations/{token}` (format attendu)
 * - `/invitations/{token}` (chemin relatif)
 * - `https://domaine/invitation?token={token}` (variante en query)
 * Renvoie '' si aucun jeton n'est identifiable (le lien est alors inexploitable).
 */
export function extractPublicToken(value: string): string {
  const raw = (value || '').trim()
  if (!raw) return ''
  const byQuery = raw.match(/[?&](?:token|publicToken)=([^&#]+)/i)
  if (byQuery?.[1]) return decodeURIComponent(byQuery[1])
  const byPath = raw.match(/\/invitations?\/([^/?#]+)/i)
  if (byPath?.[1]) return decodeURIComponent(byPath[1])
  return ''
}

/**
 * Construit un lien d'invitation **absolu et partageable**, à partir de ce que
 * renvoie le backend :
 * 1. lien absolu sur un domaine distant → conservé tel quel (le backend connaît
 *    son URL publique) ;
 * 2. lien « localhost » ou relatif → reconstruit sur une origine accessible à
 *    l'invité (`VITE_PUBLIC_BASE_URL`, sinon l'origine courante).
 */
export function absoluteInviteUrl(value: string): string {
  const raw = (value || '').trim()
  if (!raw) return ''
  const isAbsolute = /^https?:\/\//i.test(raw)
  const isLocalHost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(raw)
  if (isAbsolute && !isLocalHost) return raw
  const token = extractPublicToken(raw)
  if (token) return `${shareableOrigin()}/invitations/${token}`
  if (!isAbsolute) return `${shareableOrigin()}${raw.startsWith('/') ? raw : `/${raw}`}`
  return raw
}

/**
 * Construit un lien d'invitation à partir du contenu brut d'un QR code :
 * - URL complète (`https://…/invitations/{token}`) → `absoluteInviteUrl` ;
 * - chemin ou query portant un jeton → reconstruit sur l'origine partageable ;
 * - jeton opaque seul (le QR n'encode que le jeton public) → lien direct.
 * Renvoie '' si rien d'exploitable — l'appelant vérifie ensuite le jeton auprès
 * de l'API publique avant de proposer le lien à l'organisateur.
 */
export function inviteUrlFromPayload(payload: string): string {
  const raw = (payload || '').trim()
  if (!raw || /\s/.test(raw)) return ''
  const token = extractPublicToken(raw)
  if (token) return `${shareableOrigin()}/invitations/${token}`
  if (/^https?:\/\//i.test(raw)) return absoluteInviteUrl(raw)
  // Jeton opaque (URL-safe, assez long) : on suppose /invitations/{jeton}.
  return /^[A-Za-z0-9._~-]{8,}$/.test(raw) ? `${shareableOrigin()}/invitations/${raw}` : ''
}

function normalizeSendResult(r: SendResult): SendResult {
  const url = r.publicInviteUrl
  if (!url) return r
  r.publicInviteUrl = absoluteInviteUrl(url)
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
