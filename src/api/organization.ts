import { http, decodeList, decodeMap } from './http'
import { ApiConfig } from './config'

export interface OrgMember {
  id: number
  userId: number
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  roleCode: string
  eventId?: number | null
  active: boolean
}

export interface OrgMemberPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  roleCode: string
  eventId?: number | null
}

function parseMember(json: Record<string, unknown>): OrgMember {
  return {
    id: Number(json.id ?? 0),
    userId: Number(json.userId ?? 0),
    firstName: String(json.firstName ?? ''),
    lastName: String(json.lastName ?? ''),
    email: String(json.email ?? ''),
    phone: json.phone ? String(json.phone) : null,
    roleCode: String(json.roleCode ?? ''),
    eventId: json.eventId != null ? Number(json.eventId) : (json.weddingId != null ? Number(json.weddingId) : null),
    active: Boolean(json.active ?? true),
  }
}

const membersPath = (orgId: number) => `${ApiConfig.organizationsPath}/${orgId}/members`

export async function listMembers(orgId: number): Promise<OrgMember[]> {
  const res = await http.get(membersPath(orgId))
  return (res.data as unknown[]).map((e) => parseMember(e as Record<string, unknown>))
}

export async function addMember(orgId: number, payload: OrgMemberPayload): Promise<OrgMember> {
  const res = await http.post(membersPath(orgId), payload)
  return parseMember(decodeMap(res.data))
}

export async function updateMemberWedding(orgId: number, memberId: number, eventId: number): Promise<OrgMember> {
  const res = await http.put(`${membersPath(orgId)}/${memberId}`, { eventId })
  return parseMember(decodeMap(res.data))
}

export async function removeMember(orgId: number, memberId: number): Promise<void> {
  await http.delete(`${membersPath(orgId)}/${memberId}`)
}