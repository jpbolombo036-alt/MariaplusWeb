import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiConfig } from './config'
import { useNotificationStore } from '../stores/notifications'

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
  // Refresh token is held by the HttpOnly mp_refresh cookie, never web storage.
  refreshToken = null
}

export function loadTokens(): AuthTokens | null {
  return null
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
}

let refreshPromise: Promise<string> | null = null

export const http: AxiosInstance = axios.create({
  baseURL: `${ApiConfig.baseUrl}/`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'X-Client-Platform': 'web',
  },
})

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

function extractMessage(error: AxiosError): string {
  const data = error.response?.data
  if (data && typeof data === 'object' && 'error' in data) {
    const msg = (data as Record<string, unknown>).error
    if (typeof msg === 'string' && msg.trim()) return msg.trim()
  }
  if (typeof data === 'string' && data.trim()) return data.trim()
  return error.message || 'Une erreur est survenue.'
}

// Le endpoint refresh attend un corps brut = refresh token (rotation).
async function doRefresh(): Promise<string> {
  const res = await axios.post(
    `${ApiConfig.baseUrl}${ApiConfig.authRefresh}`,
    {},
    { withCredentials: true },
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
    const url = error.config?.url ?? ''
    const isRefreshPath = url.includes(ApiConfig.authRefresh)
    const isAuthEndpoint = url.includes(ApiConfig.authLogin) || url.includes(ApiConfig.authRegister) || isRefreshPath

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
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

    if (status && status !== 401) {
      const notify = useNotificationStore()
      notify.push(extractMessage(error), 'error')
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

