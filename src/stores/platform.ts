import { defineStore } from 'pinia'
import { http, decodeMap } from '../api/http'
import { ApiConfig } from '../api/config'

/**
 * Réglages plateforme lisibles par tout utilisateur authentifié :
 * le front s'en sert pour masquer/désactiver des boutons
 * (ex. « Nouvel événement » quand le SUPER_ADMIN l'a interdit).
 * La sécurité réelle est côté backend (EventService.create).
 */
export const usePlatformStore = defineStore('platform', {
  state: () => ({
    eventCreationEnabled: null as boolean | null,
    whatsappSendingEnabled: null as boolean | null,
    loaded: false,
  }),
  getters: {
    /** true si l'utilisateur PEUT créer (SUPER_ADMIN bypass géré par le backend ; ici on affiche et le backend tranche). */
    canCreateEvent(): boolean {
      return this.eventCreationEnabled !== false
    },
    /** true si l'envoi WhatsApp est activé pour l'utilisateur/organisation. */
    canSendWhatsapp(): boolean {
      return this.whatsappSendingEnabled !== false
    },
  },
  actions: {
    async load() {
      if (this.loaded) return
      try {
        // Sondages silencieux : un échec (403/404) ne doit pas afficher de toast.
        const [evRes, waRes] = await Promise.allSettled([
          http.get('/api/platform/event-creation-enabled', { skipNotification: true }),
          http.get(ApiConfig.platformWhatsappEnabledPath, { skipNotification: true }),
        ])
        if (evRes.status === 'fulfilled') {
          const json = decodeMap(evRes.value.data)
          this.eventCreationEnabled = Boolean(json.enabled ?? true)
        }
        if (waRes.status === 'fulfilled') {
          const json = decodeMap(waRes.value.data)
          this.whatsappSendingEnabled = Boolean(json.enabled ?? true)
        }
      } catch {
        // En cas d'échec, on n'affiche pas d'état faux : le backend validera.
        this.eventCreationEnabled = null
        this.whatsappSendingEnabled = null
      } finally {
        this.loaded = true
      }
    },
  },
})
