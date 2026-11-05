import axios, { AxiosInstance, AxiosError, CanceledError } from 'axios'
import { ApiConfig } from './config'
import { useNotificationStore } from '../stores/notifications'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * Requête de « sondage » : si elle échoue, aucun toast global n'est affiché
     * (l'appelant décide de la suite — ex. vérifier qu'un lien public est ouvrable).
     */
    skipNotification?: boolean
    /** Réponses attendues (ex. galerie facultative absente), sans toast global. */
    silentStatuses?: number[]
    /** Session qui a émis la requête, conservée lors d'une nouvelle tentative. */
    _authSessionRevision?: number
  }
}

export interface AuthTokens {
  accessToken: string
  /** Présent pour compatibilité d'appel, mais ignoré côté web : le refresh
   * token vit uniquement dans le cookie HttpOnly mp_refresh (jamais en
   * storage JS, ni en mémoire). */
  refreshToken: string
  expiresIn: number
}

// Seul l'access token est conservé, en mémoire vive (jamais persisté) : à
// chaque rechargement de page, restore() le régénère via le cookie de refresh.
let accessToken: string | null = null
let authSessionRevision = 0
let refreshRequest: {
  revision: number
  promise: Promise<string>
  controller: AbortController
} | null = null

export function setTokens(t: AuthTokens) {
  authSessionRevision++
  refreshRequest?.controller.abort()
  refreshRequest = null
  accessToken = t.accessToken
}

export function clearTokens() {
  authSessionRevision++
  refreshRequest?.controller.abort()
  refreshRequest = null
  accessToken = null
}

export const http: AxiosInstance = axios.create({
  baseURL: `${ApiConfig.baseUrl}/`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'X-Client-Platform': 'web',
  },
})

http.interceptors.request.use((config) => {
  if (config._authSessionRevision != null && config._authSessionRevision !== authSessionRevision) {
    throw new CanceledError('La session a changé.', config)
  }
  config._authSessionRevision = authSessionRevision
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

// Le refresh token est envoyé par le cookie HttpOnly, comme dans restore().
async function doRefresh(revision: number, signal: AbortSignal): Promise<string> {
  const res = await axios.post(
    `${ApiConfig.baseUrl}${ApiConfig.authRefresh}`,
    {},
    { withCredentials: true, signal, headers: { 'X-Client-Platform': 'web' } },
  )
  if (revision !== authSessionRevision) {
    throw new CanceledError('La session a changé.')
  }
  const data = (typeof res.data === 'string' ? JSON.parse(res.data) : res.data) as Record<string, unknown>
  const nextAuth: AuthTokens = {
    accessToken: String(data.accessToken ?? ''),
    refreshToken: '',
    expiresIn: Number(data.expiresIn ?? 900),
  }
  // Renouveler le JWT conserve la session des autres requêtes en attente.
  accessToken = nextAuth.accessToken
  return nextAuth.accessToken
}

http.interceptors.response.use(
  (r) => {
    // Les fiches restent montées entre leurs onglets : signaler les écritures
    // réussies pour rafraîchir leurs compteurs sans recharger toute la page.
    if (/^(post|put|patch|delete)$/i.test(r.config.method ?? '')) {
      const path = new URL(r.config.url ?? '', r.config.baseURL).pathname
      const eventMatch = path.match(/^\/api\/(?:events|weddings)\/(\d+)(?:\/|$)/)
      let eventId = eventMatch ? Number(eventMatch[1]) : null
      if (path === '/api/checkins' || /^\/api\/checkins\/\d+$/.test(path)) {
        try {
          const payload = typeof r.config.data === 'string' ? JSON.parse(r.config.data) : r.config.data
          eventId = Number(payload?.weddingId ?? payload?.eventId) || null
        } catch { /* suppression sans corps : actualiser la fiche active */ }
      } else if (!eventMatch) {
        return r
      }
      // Un scan ne modifie pas les présences ; son endpoint n'est pas retenu.
      window.dispatchEvent(new CustomEvent('mp:event-changed', { detail: { eventId } }))
    }
    return r
  },
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const isRefreshPath = url.includes(ApiConfig.authRefresh)
    const isAuthEndpoint = url.includes(ApiConfig.authLogin) || url.includes(ApiConfig.authRegister) || isRefreshPath

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      const revision = original._authSessionRevision
      if (revision !== authSessionRevision) return Promise.reject(error)
      original._retry = true
      try {
        if (!refreshRequest || refreshRequest.revision !== revision) {
          const controller = new AbortController()
          const promise: Promise<string> = doRefresh(revision, controller.signal).finally(() => {
            if (refreshRequest?.promise === promise) refreshRequest = null
          })
          refreshRequest = { revision, promise, controller }
        }
        const token = await refreshRequest.promise
        if (revision !== authSessionRevision) {
          throw new CanceledError('La session a changé.', original)
        }
        original.headers.Authorization = `Bearer ${token}`
        return http(original)
      } catch (e) {
        if (revision === authSessionRevision) {
          clearTokens()
          window.dispatchEvent(new CustomEvent('mp:session-expired'))
        }
        return Promise.reject(e)
      }
    }

    // `skipNotification` : requête de sondage (ex. vérification qu'un lien public
    // est réellement ouvrable) → pas de toast global, l'appelant gère l'échec.
    if (status && status !== 401 && !isAuthEndpoint && !error.config?.skipNotification && !error.config?.silentStatuses?.includes(status)) {
      // Les endpoints d'authentification (login/register/refresh) gèrent
      // eux-mêmes leurs erreurs à l'écran : pas de toast global, sinon un
      // simple refresh raté au chargement affiche « Refresh token invalide ».
      const notify = useNotificationStore()
      notify.push(extractMessage(error), 'error')
    }

    return Promise.reject(error)
  },
)

/**
 * Message lisible d'une erreur d'API — y compris pour un échec **réseau** ou CORS
 * (aucune réponse HTTP), cas où l'intercepteur ne notifie rien : l'appelant peut
 * ainsi afficher une raison explicite au lieu de laisser l'utilisateur sans retour.
 */
export function apiErrorMessage(error: unknown): string {
  const err = error as AxiosError | undefined
  if (!err?.response) {
    return 'Impossible de contacter le serveur (connexion perdue, ou requête bloquée par le navigateur/CORS).'
  }
  return extractMessage(err)
}

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

