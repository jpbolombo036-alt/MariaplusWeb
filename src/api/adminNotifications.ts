import { http, decodeMap, decodeList } from './http'

export type AdminNotificationType = 'ORGANIZATION_REGISTERED' | 'CONTACT_MESSAGE' | string

export interface AdminNotification {
  id: number
  type: AdminNotificationType
  title: string
  message: string
  organizationId: number | null
  userId: number | null
  senderEmail: string | null
  createdAt: string | null
  readAt: string | null
}

export interface AdminNotificationList {
  unreadCount: number
  items: AdminNotification[]
}

const BASE = '/api/admin/notifications'

function parseNotification(j: Record<string, unknown>): AdminNotification {
  return {
    id: Number(j.id),
    type: String(j.type ?? ''),
    title: String(j.title ?? ''),
    message: String(j.message ?? ''),
    organizationId: j.organizationId == null ? null : Number(j.organizationId),
    userId: j.userId == null ? null : Number(j.userId),
    senderEmail: j.senderEmail == null ? null : String(j.senderEmail),
    createdAt: j.createdAt == null ? null : String(j.createdAt),
    readAt: j.readAt == null ? null : String(j.readAt),
  }
}

/** SUPER_ADMIN bell. Background poll: failures never show a global toast. */
export async function listAdminNotifications(): Promise<AdminNotificationList> {
  const res = await http.get(BASE, { skipNotification: true })
  const json = decodeMap(res.data)
  return {
    unreadCount: Number(json.unreadCount ?? 0),
    items: decodeList(json.items).map((x) => parseNotification(x as Record<string, unknown>)),
  }
}

export async function markAdminNotificationRead(id: number): Promise<void> {
  await http.patch(`${BASE}/${id}/read`, undefined, { skipNotification: true })
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  await http.post(`${BASE}/read-all`)
}

export type AdminMessageAudience = 'ORGANIZATION' | 'ALL_ORGANIZERS'

/** SUPER_ADMIN message into organizers' bells. Returns the number of recipients. */
export async function sendAdminMessage(body: {
  audience: AdminMessageAudience
  organizationId?: number | null
  title: string
  message: string
}): Promise<number> {
  const res = await http.post('/api/admin/messages', body, { skipNotification: true })
  return Number(decodeMap(res.data).recipients ?? 0)
}

export interface UserNotification {
  id: number
  type: string
  title: string
  message: string
  broadcast: boolean
  /** Set on automatic event reminders: link to the event. */
  eventId: number | null
  createdAt: string | null
  readAt: string | null
}

const USER_BASE = '/api/notifications'

/** Signed-in user's bell. Background poll: failures never show a global toast. */
export async function listUserNotifications(): Promise<{ unreadCount: number; items: UserNotification[] }> {
  const res = await http.get(USER_BASE, { skipNotification: true })
  const json = decodeMap(res.data)
  return {
    unreadCount: Number(json.unreadCount ?? 0),
    items: decodeList(json.items).map((x) => {
      const j = x as Record<string, unknown>
      return {
        id: Number(j.id),
        type: String(j.type ?? ''),
        title: String(j.title ?? ''),
        message: String(j.message ?? ''),
        broadcast: Boolean(j.broadcast),
        eventId: j.eventId == null ? null : Number(j.eventId),
        createdAt: j.createdAt == null ? null : String(j.createdAt),
        readAt: j.readAt == null ? null : String(j.readAt),
      }
    }),
  }
}

export async function markUserNotificationRead(id: number): Promise<void> {
  await http.patch(`${USER_BASE}/${id}/read`, undefined, { skipNotification: true })
}

export async function markAllUserNotificationsRead(): Promise<void> {
  await http.post(`${USER_BASE}/read-all`)
}

/** Message from a signed-in user to the platform team (one every 10 minutes). */
export async function sendContactMessage(message: string): Promise<void> {
  await http.post('/api/contact-messages', { message }, { skipNotification: true })
}
