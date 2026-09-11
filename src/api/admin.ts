import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'
import { parseEvent, type Event } from './events'

/**
 * Réglages plateforme (interrupteurs globaux).
 * Lecture : tout utilisateur authentifié — écriture : SUPER_ADMIN (403 sinon).
 */
export interface WhatsappSettings {
  whatsappSendingEnabled: boolean
  /** Plafond de relances par invitation ; null = hériter du réglage global/env. */
  whatsappMaxReminders: number | null
}

function parseMaxReminders(json: Record<string, unknown>): number | null {
  const v = json.whatsappMaxReminders
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null
}

function parseSettings(json: Record<string, unknown>): WhatsappSettings {
  return {
    whatsappSendingEnabled: Boolean(json.whatsappSendingEnabled ?? true),
    whatsappMaxReminders: parseMaxReminders(json),
  }
}

export async function getWhatsappSettings(): Promise<WhatsappSettings> {
  const res = await http.get(ApiConfig.adminWhatsappSettingsPath)
  return parseSettings(decodeMap(res.data))
}

/**
 * Mise à jour partielle (le backend exige au moins un champ) :
 * - `enabled` : activer / désactiver l'envoi WhatsApp plateforme ;
 * - `maxReminders` : plafond de relances par invitation, `null` = hériter du global.
 */
export async function updateWhatsappSettings(
  enabled?: boolean,
  maxReminders?: number | null,
): Promise<WhatsappSettings> {
  const body: Record<string, unknown> = {}
  if (enabled !== undefined) body.enabled = enabled
  if (maxReminders !== undefined) body.whatsappMaxReminders = maxReminders
  const res = await http.put(ApiConfig.adminWhatsappSettingsPath, body)
  return parseSettings(decodeMap(res.data))
}

/* ============================================================
 * Console SUPER_ADMIN — utilisateurs, organisations, événements.
 * Toutes ces routes sont protégées côté backend (hasRole('SUPER_ADMIN')).
 * ============================================================ */

/** Page paginée renvoyée par le backend (PageResponse). */
export interface AdminPage<T> {
  content: T[]
  currentPage: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface AdminUser {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  active: boolean
  emailVerified: boolean
  lastLoginAt?: string | null
  roles: string[]
  organizationId?: number | null
}

function parseAdminUser(json: Record<string, unknown>): AdminUser {
  return {
    id: Number(json.id ?? 0),
    firstName: String(json.firstName ?? ''),
    lastName: String(json.lastName ?? ''),
    email: String(json.email ?? ''),
    phone: json.phone ? String(json.phone) : null,
    active: Boolean(json.active ?? true),
    emailVerified: Boolean(json.emailVerified ?? false),
    lastLoginAt: json.lastLoginAt ? String(json.lastLoginAt) : null,
    roles: (json.roles as unknown[])?.map(String) ?? [],
    organizationId: json.organizationId != null ? Number(json.organizationId) : null,
  }
}

function parsePage<T>(json: Record<string, unknown>, parseItem: (x: Record<string, unknown>) => T): AdminPage<T> {
  const content = (json.content as unknown[]) ?? []
  return {
    content: content.map((x) => parseItem(x as Record<string, unknown>)),
    currentPage: Number(json.currentPage ?? 0),
    pageSize: Number(json.pageSize ?? content.length),
    totalElements: Number(json.totalElements ?? content.length),
    totalPages: Number(json.totalPages ?? 1),
  }
}

/** Liste paginée de tous les utilisateurs (SUPER_ADMIN). */
export async function listUsers(page = 0, size = 25, sortBy = 'id', sortDir = 'asc'): Promise<AdminPage<AdminUser>> {
  const res = await http.get(ApiConfig.usersPath, { params: { page, size, sortBy, sortDir } })
  return parsePage(decodeMap(res.data), parseAdminUser)
}

/** Active / désactive un utilisateur (bascule côté backend). */
export async function toggleUserActive(id: number): Promise<AdminUser> {
  const res = await http.patch(`${ApiConfig.usersPath}/${id}/toggle-active`)
  return parseAdminUser(decodeMap(res.data))
}

/** Supprime définitivement un utilisateur. */
export async function deleteAdminUser(id: number): Promise<void> {
  await http.delete(`${ApiConfig.usersPath}/${id}`)
}

export interface AdminOrganization {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  active: boolean
  createdAt?: string | null
}

function parseAdminOrganization(json: Record<string, unknown>): AdminOrganization {
  return {
    id: Number(json.id ?? 0),
    name: String(json.name ?? ''),
    email: json.email ? String(json.email) : null,
    phone: json.phone ? String(json.phone) : null,
    address: json.address ? String(json.address) : null,
    active: Boolean(json.active ?? true),
    createdAt: json.createdAt ? String(json.createdAt) : null,
  }
}

/** Toutes les organisations (SUPER_ADMIN). */
export async function listOrganizations(): Promise<AdminOrganization[]> {
  const res = await http.get(ApiConfig.organizationsPath)
  return decodeList(res.data).map((x) => parseAdminOrganization(x as Record<string, unknown>))
}

/** Active / désactive une organisation (bascule côté backend). */
export async function toggleOrganizationActive(id: number): Promise<AdminOrganization> {
  const res = await http.patch(`${ApiConfig.organizationsPath}/${id}/toggle-active`)
  return parseAdminOrganization(decodeMap(res.data))
}

/** Événements de la plateforme, paginés — filtre organisationnel (SUPER_ADMIN). */
export async function listAllEvents(page = 0, size = 25, organizationId?: number | null): Promise<AdminPage<Event>> {
  const params: Record<string, unknown> = { page, size, sortBy: 'id', sortDir: 'desc' }
  if (organizationId != null) params.organizationId = organizationId
  const res = await http.get(ApiConfig.eventsPath, { params })
  return parsePage(decodeMap(res.data), parseEvent)
}