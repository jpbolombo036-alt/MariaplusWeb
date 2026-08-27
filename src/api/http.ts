import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiConfig } from './config'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Stockage des jetons en localStorage (web). NB : le refresh token n'étant pas
// aussi sensible que sur mobile, mais reste propre à la session.
let accessToken: string | null = null
let refreshToken: string | null = null

export function setTokens(t: AuthTokens) {
  accessToken = t.accessToken
  refreshToken = t.refreshToken
  localStorage.setItem('mp_access', t.accessToken)
  localStorage.setItem('mp_refresh', t.refreshToken)
  localStorage.setItem('mp_expires', String(t.expiresIn))
}

export function loadTokens(): AuthTokens | null {
  const a = localStorage.getItem('mp_access')
  const r = localStorage.getItem('mp_refresh')
  if (!a || !r) return null
  accessToken = a
  refreshToken = r
  return { accessToken: a, refreshToken: r, expiresIn: Number(localStorage.getItem('mp_expires') ?? 900) }
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('mp_access')
  localStorage.removeItem('mp_refresh')
  localStorage.removeItem('mp_expires')
}

let refreshPromise: Promise<string> | null = null

export const http: AxiosInstance = axios.create({
  baseURL: `${ApiConfig.baseUrl}/`,
  timeout: 30000,
})

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Le endpoint refresh attend un corps brut = refresh token (rotation).
async function doRefresh(): Promise<string> {
  if (!refreshToken) throw new Error('no refresh token')
  const res = await axios.post(
    `${ApiConfig.baseUrl}${ApiConfig.authRefresh}`,
    refreshToken,
    { headers: { 'Content-Type': 'application/json' } },
  )
  const data = (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as Record<string, unknown>
  const nextAuth: AuthTokens = {
    accessToken: String(data.accessToken ?? ''),
    refreshToken: String(data.refreshToken ?? ''),
    expiresIn: Number(data.expiresIn ?? 900),
  }
  setTokens(nextAuth)
  return nextAuth.accessToken
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    const status = error.response?.status
    const isRefreshPath = error.config?.url?.includes(ApiConfig.authRefresh)
    if (status === 401 && original && !original._retry && !isRefreshPath) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = doRefresh().finally(() => {
            refreshPromise = null
          })
        }
        const token = await refreshPromise
        original.headers.Authorization = `Bearer ${token}`
        return http(original)
      } catch (e) {
        clearTokens()
        window.dispatchEvent(new CustomEvent('mp:session-expired'))
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  },
)

// Helpers génériques pour décoder les réponses.
export function decodeMap(data: unknown): Record<string, unknown> {
  if (data && typeof data === 'object') return data as Record<string, unknown>
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return {}
    }
  }
  return {}
}

export function decodeList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    try {
      const p = JSON.parse(data)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }
  return []
}
