import { defineStore, getActivePinia, type Pinia } from 'pinia'
import {
  http,
  setTokens,
  clearTokens,
  decodeMap,
} from '../api/http'
import { ApiConfig } from '../api/config'
import { parseAuthUser, parseLoginResponse, type AuthUser } from '../models/auth'
import { hasAny } from '../permissions'
import { useWeddingStore } from './wedding'
import { usePlatformStore } from './platform'
import { invalidateStoreRequests, storeRequestState } from './requestState'

function resetAccountStores(pinia: Pinia | undefined = getActivePinia()) {
  useWeddingStore(pinia).reset()
  usePlatformStore(pinia).reset()
}

interface AuthState {
  user: AuthUser | null
  restored: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    restored: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    permissions: (s) => s.user?.permissions ?? [],
    roles: (s) => s.user?.roles ?? [],
    isSuperAdmin(): boolean {
      return this.roles.includes('SUPER_ADMIN')
    },
    // API masquage piloté par les permissions du backend.
    can(): (codes: string[]) => boolean {
      return (codes: string[]) => hasAny(this.permissions, ...codes)
    },
  },
  actions: {
    async login(email: string, password: string) {
      const pinia = getActivePinia()
      const revision = invalidateStoreRequests(this)
      const res = await http.post(ApiConfig.authLogin, { email, password })
      if (storeRequestState(this).revision !== revision) return
      const json = decodeMap(res.data)
      if (json.error) throw new Error(String(json.error))
      const login = parseLoginResponse(json)
      resetAccountStores(pinia)
      setTokens({
        accessToken: login.accessToken,
        refreshToken: login.refreshToken,
        expiresIn: login.expiresIn,
      })
      this.user = login.user
      this.restored = true
    },
    async register(payload: Record<string, unknown>) {
      const pinia = getActivePinia()
      const revision = invalidateStoreRequests(this)
      // POST /auth/register renvoie 201 + LoginResponse (auto-connexion côté backend).
      const res = await http.post(ApiConfig.authRegister, payload)
      if (storeRequestState(this).revision !== revision) return
      const json = decodeMap(res.data)
      if (json.error) throw new Error(String(json.error))
      const login = parseLoginResponse(json)
      resetAccountStores(pinia)
      setTokens({
        accessToken: login.accessToken,
        refreshToken: login.refreshToken,
        expiresIn: login.expiresIn,
      })
      this.user = login.user
      this.restored = true
    },
    async restore() {
      const pinia = getActivePinia()
      const request = storeRequestState(this)
      if (request.promise) return request.promise
      const revision = ++request.revision
      request.promise = (async () => {
        try {
          // The refresh token is an HttpOnly cookie; restore the in-memory access token.
          const refresh = await http.post(ApiConfig.authRefresh, {})
          if (request.revision !== revision) return
          const refreshJson = decodeMap(refresh.data)
          setTokens({
            accessToken: String(refreshJson.accessToken ?? ''),
            refreshToken: '',
            expiresIn: Number(refreshJson.expiresIn ?? 900),
          })
          const res = await http.get(ApiConfig.authMe)
          if (request.revision !== revision) return
          const json = decodeMap(res.data)
          const user = parseAuthUser(json)
          if (this.user?.id !== user.id || this.user?.organizationId !== user.organizationId) {
            resetAccountStores(pinia)
          }
          this.user = user
        } catch {
          if (request.revision !== revision) return
          clearTokens()
          this.user = null
          resetAccountStores(pinia)
        } finally {
          if (request.revision === revision) {
            this.restored = true
            request.promise = null
          }
        }
      })()
      return request.promise
    },
    async logout() {
      const pinia = getActivePinia()
      const revision = invalidateStoreRequests(this)
      // Vider l'interface tout de suite ; le JWT sert encore à révoquer la session.
      this.user = null
      this.restored = true
      resetAccountStores(pinia)
      try {
        await http.post(ApiConfig.authLogout)
      } catch {
        // déconnexion locale même si le serveur est injoignable
      }
      if (storeRequestState(this).revision === revision || !this.user) {
        clearTokens()
        resetAccountStores(pinia)
      }
    },
    expireSession() {
      invalidateStoreRequests(this)
      clearTokens()
      this.user = null
      this.restored = true
      resetAccountStores()
    },
  },
})
