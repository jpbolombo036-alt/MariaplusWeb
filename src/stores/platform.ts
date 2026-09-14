import { defineStore } from 'pinia'
import { http, decodeMap } from '../api/http'

/**
 * Réglages plateforme lisibles par tout utilisateur authentifié :
 * le front s'en sert pour masquer/désactiver des boutons
 * (ex. « Nouvel événement » quand le SUPER_ADMIN l'a interdit).
 * La sécurité réelle est côté backend (EventService.create).
 */
export const usePlatformStore = defineStore('platform', {
  state: () => ({
    eventCreationEnabled: null as boolean | null,
    loaded: false,
  }),
  getters: {
    /** true si l'utilisateur PEUT créer (SUPER_ADMIN bypass géré par le backend ; ici on affiche et le backend tranche). */
    canCreateEvent(): boolean {
      return this.eventCreationEnabled !== false
    },
  },
  actions: {
    async load() {
      if (this.loaded) return
      try {
        const res = await http.get('/api/platform/event-creation-enabled')
        const json = decodeMap(res.data)
        this.eventCreationEnabled = Boolean(json.enabled ?? true)
      } catch {
        // En cas d'échec (ex. 403), on n'affiche pas d'état faux : le backend validera.
        this.eventCreationEnabled = null
      } finally {
        this.loaded = true
      }
    },
  },
})
