import { defineStore } from 'pinia'
import {
  http,
  setTokens,
  loadTokens,
  clearTokens,
  decodeMap,
  type AuthTokens,
} from '../api/http'
import { ApiConfig } from '../api/config'
import { parseAuthUser, parseLoginResponse, type AuthUser } from '../models/auth'
import { hasAny } from '../permissions'

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
      const res = await http.post(ApiConfig.authLogin, { email, password })
      const json = decodeMap(res.data)
      if (json.error) throw new Error(String(json.error))
      const login = parseLoginResponse(json)
      setTokens({
        accessToken: login.accessToken,
        refreshToken: login.refreshToken,
        expiresIn: login.expiresIn,
      })
      this.user = login.user
      this.restored = true
    },
    async register(payload: Record<string, unknown>) {
      // POST /auth/register renvoie 201 + LoginResponse (auto-connexion côté backend).
      const res = await http.post(ApiConfig.authRegister, payload)
      const json = decodeMap(res.data)
      if (json.error) throw new Error(String(json.error))
      const login = parseLoginResponse(json)
      setTokens({
        accessToken: login.accessToken,
        refreshToken: login.refreshToken,
        expiresIn: login.expiresIn,
      })
      this.user = login.user
      this.restored = true
    },
    async restore() {
      const tokens = loadTokens()
      if (!tokens) {
        this.restored = true
        return
      }
      try {
        const res = await http.get(ApiConfig.authMe)
        const json = decodeMap(res.data)
        this.user = parseAuthUser(json)
      } catch {
        this.user = null
      }
      this.restored = true
    },
    async logout() {
      try {
        await http.post(ApiConfig.authLogout)
      } catch {
        // déconnexion locale même si le serveur est injoignable
      }
      clearTokens()
      this.user = null
      this.restored = true
    },
    expireSession() {
      clearTokens()
      this.user = null
      this.restored = true
    },
  },
})
