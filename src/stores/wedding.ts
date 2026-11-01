import { defineStore } from 'pinia'
import { listAllEvents, type Event } from '../api/events'
import { pickDefaultEventId } from '../utils/eventStatus'
import { invalidateStoreRequests, storeRequestState } from './requestState'

const STORAGE_KEY = 'mp_active_event'

/**
 * Store partagé de l'événement actif : la sidebar, le dashboard et les écrans
 * métier travaillent tous sur le MÊME événement sélectionné.
 */
export const useWeddingStore = defineStore('wedding', {
  state: () => ({
    weddings: [] as Event[],
    activeId: null as number | null,
    loading: false,
    loaded: false,
  }),
  getters: {
    /**
     * Événement actif. Si l'id courant n'est plus valide (ou devient passé),
     * on retombe sur la même cascade de sélection par défaut que `load()`.
     */
    active(state): Event | null {
      if (!state.weddings.length) return null
      const byId = state.weddings.find((w) => w.id === state.activeId)
      if (byId) return byId
      const fallback = pickDefaultEventId(state.weddings, null)
      return state.weddings.find((w) => w.id === fallback) ?? null
    },
  },
  actions: {
    reset() {
      invalidateStoreRequests(this)
      this.$reset()
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        /* stockage indisponible */
      }
    },
    setActive(id: number) {
      this.activeId = id
      try {
        sessionStorage.setItem(STORAGE_KEY, String(id))
      } catch {
        /* stockage indisponible */
      }
    },
    async load(force = false) {
      const request = storeRequestState(this)
      if (request.promise && !force) return request.promise
      if (this.loaded && !force) return

      const revision = ++request.revision
      this.loading = true
      request.promise = (async () => {
        try {
          const weddings = await listAllEvents()
          if (request.revision !== revision) return
          this.weddings = weddings
          let saved: string | null = null
          try {
            saved = sessionStorage.getItem(STORAGE_KEY)
          } catch {
            /* stockage indisponible */
          }
          const savedId = saved ? Number(saved) : null
          // Cascade intelligente : le choix de session n'est honoré que s'il
          // existe encore et n'est ni passé ni annulé ; sinon on prend
          // l'événement à venir le plus pertinent — jamais un événement passé
          // par défaut (sauf si tous le sont).
          this.activeId = pickDefaultEventId(this.weddings, savedId)
          if (this.activeId != null) {
            try {
              sessionStorage.setItem(STORAGE_KEY, String(this.activeId))
            } catch {
              /* stockage indisponible */
            }
          }
          this.loaded = true
        } catch (error) {
          if (request.revision === revision) throw error
        } finally {
          if (request.revision === revision) {
            this.loading = false
            request.promise = null
          }
        }
      })()

      return request.promise
    },
  },
})
