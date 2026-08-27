export interface AuthUser {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  active: boolean
  roles: string[]
  permissions: string[]
  organizationId?: number | null
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  user: AuthUser
}

export function parseAuthUser(json: Record<string, unknown>): AuthUser {
  return {
    id: Number(json.id ?? 0),
    firstName: String(json.firstName ?? ''),
    lastName: String(json.lastName ?? ''),
    email: String(json.email ?? ''),
    phone: json.phone ? String(json.phone) : null,
    active: Boolean(json.active ?? true),
    roles: (json.roles as unknown[])?.map(String) ?? [],
    permissions: (json.permissions as unknown[])?.map(String) ?? [],
    organizationId: json.organizationId ? Number(json.organizationId) : null,
  }
}

export function parseLoginResponse(json: Record<string, unknown>): LoginResponse {
  const user = (json.user as Record<string, unknown>) ?? {}
  return {
    accessToken: String(json.accessToken ?? ''),
    refreshToken: String(json.refreshToken ?? ''),
    expiresIn: Number(json.expiresIn ?? 900),
    tokenType: String(json.tokenType ?? 'Bearer'),
    user: parseAuthUser(user),
  }
}
