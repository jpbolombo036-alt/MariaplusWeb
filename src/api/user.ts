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