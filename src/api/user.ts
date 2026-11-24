import { http, decodeMap } from './http'
import { ApiConfig } from './config'

export interface ProfilePayload {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
}

export async function updateMyProfile(payload: ProfilePayload): Promise<Record<string, unknown>> {
  const res = await http.put(ApiConfig.usersPath + '/me', payload)
  return decodeMap(res.data)
}

export async function changeMyPassword(oldPassword: string, newPassword: string): Promise<void> {
  await http.put(`${ApiConfig.usersPath}/me/password`, { oldPassword, newPassword })
}

/**
 * Public "forgot password" request, handled by a SUPER_ADMIN (no SMTP needed).
 * The server answers the same whether or not the account exists.
 */
export async function requestPasswordReset(email: string): Promise<string> {
  const res = await http.post('/auth/password-reset-requests', { email }, { skipNotification: true })
  return String(decodeMap(res.data).message
    ?? 'Si un compte correspond à cette adresse, notre équipe a été prévenue et vous contactera.')
}

export function avatarUrl(version: number): string {
  // http (instance axios) gère le token ; pour <img> on passe par axios en blob.
  return `${ApiConfig.usersPath}/me/avatar?v=${version}`
}

/** Charge la photo de profil en blob URL (null si 404 = pas de photo). */
export async function loadMyAvatar(version: number): Promise<string | null> {
  try {
    const res = await http.get(`${ApiConfig.usersPath}/me/avatar`, { responseType: 'blob' })
    return URL.createObjectURL(res.data as Blob)
  } catch {
    void version
    return null
  }
}

export async function uploadMyAvatar(file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await http.put(`${ApiConfig.usersPath}/me/avatar`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function deleteMyAvatar(): Promise<void> {
  await http.delete(`${ApiConfig.usersPath}/me/avatar`)
}